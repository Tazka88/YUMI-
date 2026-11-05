import React, { useState, useEffect, useRef } from 'react';
import { 
  Monitor, Smartphone, Upload, Trash2, RefreshCw, Play, Pause, 
  Volume2, VolumeX, Save, X, AlertCircle, CheckCircle2, 
  ArrowLeftRight, FileVideo, Sparkles, Layers, ShieldCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { HeroVideoConfig } from '../../components/HeroVideo';

const DEFAULT_CONFIG: HeroVideoConfig = {
  enabled: true,
  video_source_mode: 'separate',
  desktop_aspect_ratio: 'aspect-video',
  mobile_aspect_ratio: 'aspect-[9/16]',
  object_fit: 'cover',
  desktop_video_url: '',
  mobile_video_url: '',
  video_url: '',
  title: '',
  subtitle: '',
  button_text: '',
  button_link: '',
  overlay_opacity: 20,
  show_sound_control: true
};

interface StagedFile {
  file: File;
  previewUrl: string;
  name: string;
  sizeFormatted: string;
}

export default function HeroVideoAdmin() {
  // Persisted configuration from database
  const [savedConfig, setSavedConfig] = useState<HeroVideoConfig>(DEFAULT_CONFIG);
  // Staging configuration for in-flight edits before clicking "Enregistrer"
  const [config, setConfig] = useState<HeroVideoConfig>(DEFAULT_CONFIG);

  // Staged local video files (immediate blob preview before uploading)
  const [stagedDesktop, setStagedDesktop] = useState<StagedFile | null>(null);
  const [stagedMobile, setStagedMobile] = useState<StagedFile | null>(null);

  // Track replaced or deleted URLs to delete from storage upon save
  const [pendingDeletions, setPendingDeletions] = useState<string[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ desktop: number; mobile: number }>({ desktop: 0, mobile: 0 });
  const [uploadStatusText, setUploadStatusText] = useState<string>('');

  // Live preview controls
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [desktopVideoError, setDesktopVideoError] = useState(false);
  const [mobileVideoError, setMobileVideoError] = useState(false);

  // Video element refs
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const desktopCardVideoRef = useRef<HTMLVideoElement | null>(null);
  const mobileCardVideoRef = useRef<HTMLVideoElement | null>(null);

  // Hidden file inputs
  const desktopFileInputRef = useRef<HTMLInputElement | null>(null);
  const mobileFileInputRef = useRef<HTMLInputElement | null>(null);

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} Ko`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  // Helper to extract clean file name from URL
  const getFileNameFromUrl = (url?: string): string => {
    if (!url) return '';
    try {
      const clean = url.split('/').pop()?.split('?')[0] || '';
      return clean.length > 32 ? `${clean.substring(0, 28)}...` : clean;
    } catch {
      return url;
    }
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = Boolean(
    stagedDesktop !== null ||
    stagedMobile !== null ||
    config.desktop_video_url !== savedConfig.desktop_video_url ||
    config.mobile_video_url !== savedConfig.mobile_video_url ||
    config.enabled !== savedConfig.enabled ||
    config.title !== savedConfig.title ||
    config.subtitle !== savedConfig.subtitle ||
    config.button_text !== savedConfig.button_text ||
    config.button_link !== savedConfig.button_link ||
    config.overlay_opacity !== savedConfig.overlay_opacity ||
    config.show_sound_control !== savedConfig.show_sound_control ||
    pendingDeletions.length > 0
  );

  // 1. Fetch current settings from database
  const loadSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/settings?t=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const rawConfig = data.hero_video_config;
        if (rawConfig) {
          const parsed = typeof rawConfig === 'string' ? JSON.parse(rawConfig) : rawConfig;
          const merged: HeroVideoConfig = {
            ...DEFAULT_CONFIG,
            ...parsed,
            video_source_mode: 'separate',
            desktop_aspect_ratio: parsed.desktop_aspect_ratio || 'aspect-video',
            mobile_aspect_ratio: parsed.mobile_aspect_ratio || 'aspect-[9/16]',
            object_fit: 'cover',
          };
          setSavedConfig(merged);
          setConfig(merged);
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      toast.error('Erreur lors du chargement de la configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Helper to resolve relative uploads to Supabase CDN or return absolute URL
  const resolveVideoUrl = (rawUrl?: string): string => {
    if (!rawUrl) return '';
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('blob:')) {
      return rawUrl;
    }
    if (rawUrl.startsWith('/uploads/')) {
      const fileName = rawUrl.replace(/^\/uploads\//, '');
      return `https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/${fileName}`;
    }
    return rawUrl;
  };

  // Sync preview video playback whenever active video URL or device changes
  const activePreviewUrl = resolveVideoUrl(
    previewDevice === 'desktop'
      ? (config.desktop_video_url || '')
      : (config.mobile_video_url || config.desktop_video_url || '')
  );

  useEffect(() => {
    const video = previewVideoRef.current;
    if (video && activePreviewUrl) {
      video.muted = isMuted;
      video.defaultMuted = isMuted;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPaused(false))
          .catch(() => {
            // Autoplay policy fallback: force mute
            video.muted = true;
            setIsMuted(true);
            video.play().then(() => setIsPaused(false)).catch(() => setIsPaused(true));
          });
      }
    }
  }, [activePreviewUrl, previewDevice, isMuted]);

  // Clean up staged blob URLs on unmount
  useEffect(() => {
    return () => {
      if (stagedDesktop?.previewUrl) URL.revokeObjectURL(stagedDesktop.previewUrl);
      if (stagedMobile?.previewUrl) URL.revokeObjectURL(stagedMobile.previewUrl);
    };
  }, [stagedDesktop, stagedMobile]);

  // Handle local file selection with immediate preview
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, device: 'desktop' | 'mobile') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate video mime or extension
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|avi|mkv|3gp)$/i.test(file.name);
    if (!isVideo) {
      toast.error('Veuillez sélectionner un fichier vidéo valide (.mp4, .webm, .mov)');
      e.target.value = '';
      return;
    }

    const maxSize = 200 * 1024 * 1024; // 200MB
    if (file.size > maxSize) {
      toast.error(`Le fichier est trop lourd (${formatSize(file.size)}). La taille maximale est de 200 Mo.`);
      e.target.value = '';
      return;
    }

    // Generate immediate blob preview URL
    const previewUrl = URL.createObjectURL(file);
    const stagedData: StagedFile = {
      file,
      previewUrl,
      name: file.name,
      sizeFormatted: formatSize(file.size)
    };

    if (device === 'desktop') {
      // If there was an existing saved URL, mark it for deletion on save
      if (savedConfig.desktop_video_url && !pendingDeletions.includes(savedConfig.desktop_video_url)) {
        setPendingDeletions(prev => [...prev, savedConfig.desktop_video_url!]);
      }
      if (stagedDesktop?.previewUrl) {
        URL.revokeObjectURL(stagedDesktop.previewUrl);
      }
      setStagedDesktop(stagedData);
      setConfig(prev => ({ ...prev, desktop_video_url: previewUrl }));
      setDesktopVideoError(false);
      setPreviewDevice('desktop');
      toast.success('Vidéo Ordinateur 16:9 sélectionnée ! Aperçu immédiat disponible.');
    } else {
      // Mobile
      if (savedConfig.mobile_video_url && !pendingDeletions.includes(savedConfig.mobile_video_url)) {
        setPendingDeletions(prev => [...prev, savedConfig.mobile_video_url!]);
      }
      if (stagedMobile?.previewUrl) {
        URL.revokeObjectURL(stagedMobile.previewUrl);
      }
      setStagedMobile(stagedData);
      setConfig(prev => ({ ...prev, mobile_video_url: previewUrl }));
      setMobileVideoError(false);
      setPreviewDevice('mobile');
      toast.success('Vidéo Mobile 9:16 sélectionnée ! Aperçu immédiat disponible.');
    }

    e.target.value = '';
  };

  // Handle removing a video
  const handleRemoveVideo = (device: 'desktop' | 'mobile') => {
    if (device === 'desktop') {
      if (savedConfig.desktop_video_url && !pendingDeletions.includes(savedConfig.desktop_video_url)) {
        setPendingDeletions(prev => [...prev, savedConfig.desktop_video_url!]);
      }
      if (stagedDesktop?.previewUrl) {
        URL.revokeObjectURL(stagedDesktop.previewUrl);
        setStagedDesktop(null);
      }
      setConfig(prev => ({ ...prev, desktop_video_url: '' }));
      setDesktopVideoError(false);
      toast('Vidéo Ordinateur retirée. Cliquez sur "Enregistrer les modifications" pour valider.');
    } else {
      if (savedConfig.mobile_video_url && !pendingDeletions.includes(savedConfig.mobile_video_url)) {
        setPendingDeletions(prev => [...prev, savedConfig.mobile_video_url!]);
      }
      if (stagedMobile?.previewUrl) {
        URL.revokeObjectURL(stagedMobile.previewUrl);
        setStagedMobile(null);
      }
      setConfig(prev => ({ ...prev, mobile_video_url: '' }));
      setMobileVideoError(false);
      toast('Vidéo Mobile retirée. Cliquez sur "Enregistrer les modifications" pour valider.');
    }
  };

  // Cancel all staged changes and revert to saved state
  const handleCancel = () => {
    if (stagedDesktop?.previewUrl) URL.revokeObjectURL(stagedDesktop.previewUrl);
    if (stagedMobile?.previewUrl) URL.revokeObjectURL(stagedMobile.previewUrl);

    setStagedDesktop(null);
    setStagedMobile(null);
    setPendingDeletions([]);
    setConfig(savedConfig);
    setDesktopVideoError(false);
    setMobileVideoError(false);
    toast.success('Modifications annulées. État d\'origine restauré.');
  };

  // Upload single file in resilient 2MB chunks
  const uploadFileInChunks = async (
    file: File, 
    customPrefix: string,
    onProgress: (pct: number) => void
  ): Promise<string> => {
    const token = localStorage.getItem('adminToken');
    const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunk
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const uploadId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunkBlob = file.slice(start, end);

      const formData = new FormData();
      formData.append('file', chunkBlob, file.name);
      formData.append('uploadId', uploadId);
      formData.append('chunkIndex', String(i));
      formData.append('totalChunks', String(totalChunks));
      formData.append('fileName', file.name);
      formData.append('customName', `hero-${customPrefix}`);

      const res = await fetch('/api/admin/upload-chunk', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Erreur lors de l'envoi du fragment ${i + 1}/${totalChunks}`);
      }

      const pct = Math.round(((i + 1) / totalChunks) * 100);
      onProgress(pct);

      if (data.done && data.url) {
        return data.url;
      }
    }
    throw new Error('Le téléversement n\'a pas pu se terminer.');
  };

  // Save all changes: Upload staged files, save settings to DB, delete replaced files
  const handleSaveChanges = async () => {
    setSaving(true);
    const token = localStorage.getItem('adminToken');

    try {
      let finalDesktopUrl = config.desktop_video_url;
      let finalMobileUrl = config.mobile_video_url;

      // 1. Upload Desktop Video if staged
      if (stagedDesktop) {
        setUploadStatusText('Téléversement de la vidéo Ordinateur 16:9...');
        finalDesktopUrl = await uploadFileInChunks(stagedDesktop.file, 'desktop', (pct) => {
          setUploadProgress(prev => ({ ...prev, desktop: pct }));
        });
      }

      // 2. Upload Mobile Video if staged
      if (stagedMobile) {
        setUploadStatusText('Téléversement de la vidéo Mobile 9:16...');
        finalMobileUrl = await uploadFileInChunks(stagedMobile.file, 'mobile', (pct) => {
          setUploadProgress(prev => ({ ...prev, mobile: pct }));
        });
      }

      setUploadStatusText('Enregistrement de la configuration en base de données...');

      // 3. Prepare payload configuration
      const updatedConfig: HeroVideoConfig = {
        ...config,
        desktop_video_url: finalDesktopUrl,
        mobile_video_url: finalMobileUrl,
        desktop_aspect_ratio: 'aspect-video',
        mobile_aspect_ratio: 'aspect-[9/16]',
        video_source_mode: 'separate',
        object_fit: 'cover'
      };

      // 4. Save to PostgreSQL / Supabase settings table
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ hero_video_config: JSON.stringify(updatedConfig) })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erreur lors de l\'enregistrement en base de données');
      }

      // 5. Clean up old replaced/deleted files from storage (only after successful save)
      if (pendingDeletions.length > 0) {
        setUploadStatusText('Nettoyage des anciens fichiers remplacés...');
        for (const oldUrl of pendingDeletions) {
          // Do not delete if still in use in the new configuration
          if (oldUrl && oldUrl !== finalDesktopUrl && oldUrl !== finalMobileUrl) {
            try {
              await fetch('/api/admin/delete-media', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ url: oldUrl })
              });
            } catch (delErr) {
              console.warn('Old file cleanup error:', delErr);
            }
          }
        }
      }

      // Revoke any blob preview URLs
      if (stagedDesktop?.previewUrl) URL.revokeObjectURL(stagedDesktop.previewUrl);
      if (stagedMobile?.previewUrl) URL.revokeObjectURL(stagedMobile.previewUrl);

      // 6. Update local state to committed state
      setSavedConfig(updatedConfig);
      setConfig(updatedConfig);
      setStagedDesktop(null);
      setStagedMobile(null);
      setPendingDeletions([]);

      // Notify live site
      window.dispatchEvent(new Event('zorando_sections_updated'));
      toast.success('Vidéos Hero et configuration enregistrées avec succès !');
    } catch (err: any) {
      console.error('Save failed:', err);
      toast.error(err.message || 'Erreur lors de l\'enregistrement des modifications');
    } finally {
      setSaving(false);
      setUploadProgress({ desktop: 0, mobile: 0 });
      setUploadStatusText('');
    }
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    const video = previewVideoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPaused(false)).catch(() => {});
    } else {
      video.pause();
      setIsPaused(true);
    }
  };

  // Toggle sound
  const toggleMute = () => {
    const video = previewVideoRef.current;
    if (!video) return;
    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted && video.paused) {
      video.play().then(() => setIsPaused(false)).catch(() => {});
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[360px]">
        <RefreshCw size={32} className="animate-spin text-orange-500 mb-3" />
        <p className="text-sm font-semibold text-gray-700">Chargement de la gestion des vidéos Hero...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Hidden file inputs */}
      <input
        ref={desktopFileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'desktop')}
      />
      <input
        ref={mobileFileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'mobile')}
      />

      {/* Top Header & Activation Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-gray-900 text-white p-6 rounded-2xl shadow-md border border-neutral-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
                <Sparkles size={12} /> ZORANDO Hero Studio
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Gestion des Vidéos Hero</h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl">
              Téléversez vos vidéos pour ordinateur (16:9) et téléphone (9:16). Prévisualisez le rendu exact en direct avant de publier vos modifications.
            </p>
          </div>

          {/* Toggle Switch Hero Enabled */}
          <div className="flex items-center gap-3 bg-neutral-800/80 p-3 rounded-xl border border-neutral-700 self-start md:self-auto">
            <div className="text-right">
              <span className="block text-xs font-bold text-gray-200">
                {config.enabled ? 'Vidéo Hero Activée' : 'Vidéo Hero Désactivée'}
              </span>
              <span className="text-[10px] text-gray-400">
                {config.enabled ? 'Visible sur la page d\'accueil' : 'Le slider standard est affiché'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                config.enabled ? 'bg-orange-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  config.enabled ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Upload Slots (50%) & Right Live Hero Preview (50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= LEFT COLUMN: UPLOAD CONTROLS ================= */}
        <div className="lg:col-span-6 space-y-6">

          {/* SECTION 1: VIDÉO HERO ORDINATEUR (16:9) */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-xs">
                  <Monitor size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 uppercase tracking-tight">Vidéo Hero Ordinateur</h2>
                  <p className="text-xs text-gray-500">Format recommandé : <span className="font-semibold text-orange-600">16:9 (Horizontal / HD)</span></p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
                16:9 HD
              </span>
            </div>

            {/* Desktop Video Card: Upload or Preview State */}
            {config.desktop_video_url ? (
              <div className="space-y-3">
                {/* Immediate Mini Video Player */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-gray-200 shadow-inner group">
                  <video
                    ref={desktopCardVideoRef}
                    key={config.desktop_video_url}
                    src={resolveVideoUrl(config.desktop_video_url)}
                    autoPlay
                    muted
                    loop
                    playsInline
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                    onError={() => setDesktopVideoError(true)}
                    onLoadedMetadata={() => setDesktopVideoError(false)}
                  />

                  {/* Staged Badge */}
                  {stagedDesktop && (
                    <div className="absolute top-2 left-2 z-10 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-md flex items-center gap-1">
                      <Sparkles size={11} /> Nouveau fichier sélectionné (Non enregistré)
                    </div>
                  )}

                  {/* Playback Error Warning */}
                  {desktopVideoError && (
                    <div className="absolute inset-0 bg-neutral-900/90 flex flex-col items-center justify-center p-4 text-center text-white z-20">
                      <AlertCircle size={28} className="text-amber-400 mb-1" />
                      <p className="text-xs font-semibold">Fichier en cours de traitement ou format non supporté</p>
                      <button
                        type="button"
                        onClick={() => desktopFileInputRef.current?.click()}
                        className="mt-2 text-xs bg-orange-500 hover:bg-orange-600 px-3 py-1 rounded-lg text-white font-medium"
                      >
                        Sélectionner une autre vidéo
                      </button>
                    </div>
                  )}
                </div>

                {/* File info bar */}
                <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 truncate">
                    <FileVideo size={16} className="text-orange-500 shrink-0" />
                    <span className="font-medium text-gray-800 truncate">
                      {stagedDesktop ? stagedDesktop.name : getFileNameFromUrl(config.desktop_video_url)}
                    </span>
                    {stagedDesktop && (
                      <span className="text-[11px] text-gray-400">({stagedDesktop.sizeFormatted})</span>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    stagedDesktop ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {stagedDesktop ? 'À enregistrer' : 'En ligne'}
                  </span>
                </div>

                {/* Buttons: Remplacer / Supprimer */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => desktopFileInputRef.current?.click()}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 transition active:scale-95"
                  >
                    <ArrowLeftRight size={14} className="text-gray-600" />
                    <span>Remplacer la vidéo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveVideo('desktop')}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition active:scale-95"
                  >
                    <Trash2 size={14} />
                    <span>Supprimer la vidéo</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Empty state: Upload button */
              <div
                onClick={() => desktopFileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-orange-500 hover:bg-orange-50/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition group"
              >
                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-110 transition duration-200 mb-3 shadow-xs">
                  <Upload size={22} />
                </div>
                <h3 className="text-sm font-bold text-gray-800 mb-1">
                  Télécharger une vidéo Ordinateur
                </h3>
                <p className="text-xs text-gray-500 mb-3 max-w-xs">
                  Glissez-déposez ou cliquez pour sélectionner un fichier vidéo depuis votre ordinateur.
                </p>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold shadow-sm group-hover:bg-orange-600 transition">
                  <Upload size={14} />
                  <span>Sélectionner la vidéo (16:9)</span>
                </span>
                <span className="text-[10px] text-gray-400 mt-2">MP4, WebM, MOV jusqu'à 200 Mo</span>
              </div>
            )}
          </div>

          {/* SECTION 2: VIDÉO HERO TÉLÉPHONE (9:16) */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 uppercase tracking-tight">Vidéo Hero Téléphone</h2>
                  <p className="text-xs text-gray-500">Format recommandé : <span className="font-semibold text-blue-600">9:16 (Vertical / TikTok)</span></p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                9:16 Vertical
              </span>
            </div>

            {/* Mobile Video Card: Upload or Preview State */}
            {config.mobile_video_url ? (
              <div className="space-y-3">
                <div className="flex gap-4 items-center">
                  {/* Vertical mini preview */}
                  <div className="relative w-28 h-48 rounded-xl overflow-hidden bg-black border border-gray-200 shadow-inner shrink-0">
                    <video
                      ref={mobileCardVideoRef}
                      key={config.mobile_video_url}
                      src={resolveVideoUrl(config.mobile_video_url)}
                      autoPlay
                      muted
                      loop
                      playsInline
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover"
                      onError={() => setMobileVideoError(true)}
                      onLoadedMetadata={() => setMobileVideoError(false)}
                    />

                    {mobileVideoError && (
                      <div className="absolute inset-0 bg-neutral-900/90 flex flex-col items-center justify-center p-2 text-center text-white z-20">
                        <AlertCircle size={18} className="text-amber-400 mb-1" />
                        <span className="text-[9px]">Erreur vidéo</span>
                      </div>
                    )}
                  </div>

                  {/* Info and actions */}
                  <div className="flex-1 space-y-2">
                    {stagedMobile && (
                      <div className="inline-flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                        <Sparkles size={11} /> Nouveau fichier sélectionné
                      </div>
                    )}

                    <div className="text-xs text-gray-700 font-medium break-all">
                      {stagedMobile ? stagedMobile.name : getFileNameFromUrl(config.mobile_video_url)}
                    </div>

                    <div className="text-[11px] text-gray-400">
                      Format vertical 9:16 adapté à l'écran plein smartphone.
                      {stagedMobile && ` • ${stagedMobile.sizeFormatted}`}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => mobileFileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 transition active:scale-95"
                      >
                        <ArrowLeftRight size={13} />
                        <span>Remplacer la vidéo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveVideo('mobile')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition active:scale-95"
                      >
                        <Trash2 size={13} />
                        <span>Supprimer la vidéo</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Empty state: Upload button */
              <div
                onClick={() => mobileFileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition group"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition duration-200 mb-3 shadow-xs">
                  <Smartphone size={22} />
                </div>
                <h3 className="text-sm font-bold text-gray-800 mb-1">
                  Télécharger une vidéo Téléphone
                </h3>
                <p className="text-xs text-gray-500 mb-3 max-w-xs">
                  Glissez-déposez ou cliquez pour sélectionner un fichier vidéo vertical adapté au mobile.
                </p>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm group-hover:bg-blue-700 transition">
                  <Upload size={14} />
                  <span>Sélectionner la vidéo (9:16)</span>
                </span>
                <span className="text-[10px] text-gray-400 mt-2">MP4, WebM, MOV jusqu'à 200 Mo</span>
              </div>
            )}
          </div>

          {/* Optional Caption & Button Settings (Accordion/Collapsible) */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Layers size={14} className="text-orange-500" />
              <span>Texte & Bouton d'action sur la vidéo (Optionnel)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Titre principal</label>
                <input
                  type="text"
                  value={config.title || ''}
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  placeholder="Ex: Nouvelle Collection 2026"
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sous-titre</label>
                <input
                  type="text"
                  value={config.subtitle || ''}
                  onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
                  placeholder="Ex: Jusqu'à -50% sur l'électroménager"
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Texte du bouton</label>
                <input
                  type="text"
                  value={config.button_text || ''}
                  onChange={(e) => setConfig({ ...config, button_text: e.target.value })}
                  placeholder="Ex: Découvrir les offres"
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Lien du bouton</label>
                <input
                  type="text"
                  value={config.button_link || ''}
                  onChange={(e) => setConfig({ ...config, button_link: e.target.value })}
                  placeholder="Ex: /category/all"
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: LIVE HERO PREVIEW ================= */}
        <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-4">
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            
            {/* Preview Header & Device Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
                  <span>Prévisualisation avant enregistrement</span>
                  {hasUnsavedChanges && (
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Modifications en cours" />
                  )}
                </h2>
                <p className="text-xs text-gray-500">Rendu exact tel qu'affiché sur le site</p>
              </div>

              {/* Device Tabs */}
              <div className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    previewDevice === 'desktop'
                      ? 'bg-white text-orange-600 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Monitor size={15} />
                  <span>Ordinateur (16:9)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    previewDevice === 'mobile'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Smartphone size={15} />
                  <span>Téléphone (9:16)</span>
                </button>
              </div>
            </div>

            {/* Playback Controls (Play/Pause, Sound) */}
            <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-xl">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlayPause}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 font-medium active:scale-95 transition"
                >
                  {isPaused ? <Play size={13} className="text-orange-500 fill-orange-500" /> : <Pause size={13} />}
                  <span>{isPaused ? 'Lire' : 'Pause'}</span>
                </button>

                <button
                  type="button"
                  onClick={toggleMute}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 font-medium active:scale-95 transition"
                >
                  {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} className="text-orange-500" />}
                  <span>{isMuted ? 'Son coupé' : 'Son activé'}</span>
                </button>
              </div>

              <span className="text-[11px] text-gray-400 hidden sm:inline">
                {previewDevice === 'desktop' ? 'Format 16:9 sans déformation' : 'Format 9:16 vertical smartphone'}
              </span>
            </div>

            {/* PREVIEW CONTAINER */}
            <div className="flex justify-center items-center min-h-[380px] bg-neutral-900/95 p-4 sm:p-6 rounded-2xl border border-neutral-800 shadow-inner">
              
              {/* DESKTOP PREVIEW FRAME (16:9) */}
              {previewDevice === 'desktop' ? (
                <div className="w-full max-w-xl space-y-2">
                  <div className="bg-neutral-800 rounded-t-xl px-3 py-1.5 flex items-center justify-between border-b border-neutral-700 text-[10px] text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                      <span className="ml-2 font-mono text-gray-300">zorando.dz/</span>
                    </div>
                    <span className="bg-neutral-700 px-2 py-0.5 rounded text-[10px] text-orange-400 font-semibold">16:9 HD</span>
                  </div>

                  <div className="relative aspect-video w-full rounded-b-xl overflow-hidden bg-black shadow-2xl">
                    {config.desktop_video_url ? (
                      <>
                        <video
                          ref={previewVideoRef}
                          key={`preview-desktop-${config.desktop_video_url}`}
                          src={resolveVideoUrl(config.desktop_video_url)}
                          autoPlay
                          muted={isMuted}
                          loop
                          playsInline
                          preload="auto"
                          crossOrigin="anonymous"
                          className="w-full h-full object-cover"
                          onPlay={() => setIsPaused(false)}
                          onPause={() => setIsPaused(true)}
                        />

                        {/* Visual Overlay */}
                        <div 
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            backgroundColor: `rgba(0, 0, 0, ${(config.overlay_opacity ?? 20) / 100})`,
                            backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)'
                          }}
                        />

                        {/* Title & Button Overlay */}
                        {(config.title || config.button_text) && (
                          <div className="absolute inset-x-4 bottom-4 text-white pointer-events-none">
                            {config.title && <h3 className="text-base sm:text-lg font-bold leading-tight drop-shadow">{config.title}</h3>}
                            {config.subtitle && <p className="text-xs text-gray-200 mt-1 line-clamp-1 drop-shadow">{config.subtitle}</p>}
                            {config.button_text && (
                              <div className="mt-2 inline-block bg-orange-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow">
                                {config.button_text}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                        <Monitor size={36} className="mb-2 text-gray-600" />
                        <p className="text-sm font-semibold text-gray-300">Aucune vidéo Ordinateur configurée</p>
                        <p className="text-xs text-gray-500 mt-1">Le site affichera le slider standard avec vos bannières.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* MOBILE PREVIEW FRAME (9:16 Mockup) */
                <div className="w-[280px] bg-neutral-800 rounded-[36px] p-3 shadow-2xl border-4 border-neutral-700">
                  {/* Smartphone Speaker & Notch */}
                  <div className="flex justify-center items-center py-1 mb-2">
                    <div className="w-16 h-3 bg-neutral-900 rounded-full flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
                    </div>
                  </div>

                  {/* 9:16 Vertical Screen */}
                  <div className="relative aspect-[9/16] w-full rounded-[24px] overflow-hidden bg-black shadow-inner">
                    {(config.mobile_video_url || config.desktop_video_url) ? (
                      <>
                        <video
                          ref={previewVideoRef}
                          key={`preview-mobile-${config.mobile_video_url || config.desktop_video_url}`}
                          src={resolveVideoUrl(config.mobile_video_url || config.desktop_video_url)}
                          autoPlay
                          muted={isMuted}
                          loop
                          playsInline
                          preload="auto"
                          crossOrigin="anonymous"
                          className="w-full h-full object-cover"
                          onPlay={() => setIsPaused(false)}
                          onPause={() => setIsPaused(true)}
                        />

                        {/* Visual Overlay */}
                        <div 
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            backgroundColor: `rgba(0, 0, 0, ${(config.overlay_opacity ?? 20) / 100})`,
                            backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)'
                          }}
                        />

                        {/* Title & Button Overlay */}
                        {(config.title || config.button_text) && (
                          <div className="absolute inset-x-3 bottom-4 text-white pointer-events-none">
                            {config.title && <h3 className="text-xs font-bold leading-tight drop-shadow">{config.title}</h3>}
                            {config.subtitle && <p className="text-[10px] text-gray-200 mt-0.5 line-clamp-1 drop-shadow">{config.subtitle}</p>}
                            {config.button_text && (
                              <div className="mt-1.5 inline-block bg-orange-500 text-white text-[10px] font-semibold px-3 py-1 rounded-full shadow">
                                {config.button_text}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 text-gray-400">
                        <Smartphone size={32} className="mb-2 text-gray-600" />
                        <p className="text-xs font-semibold text-gray-300">Aucune vidéo Mobile</p>
                        <p className="text-[10px] text-gray-500 mt-1">Le slider standard sera affiché sur smartphone.</p>
                      </div>
                    )}
                  </div>

                  {/* Smartphone Home Bar */}
                  <div className="flex justify-center items-center pt-2">
                    <div className="w-20 h-1 bg-neutral-600 rounded-full" />
                  </div>
                </div>
              )}
            </div>

            {/* Hint Notice */}
            <div className="flex items-start gap-2 bg-blue-50/70 text-blue-800 p-3 rounded-xl text-xs border border-blue-100">
              <ShieldCheck size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Sécurité garantie :</strong> Vos modifications restent privées dans ce panneau. Aucune modification n'est publiée sur le site avant de cliquer sur <strong>« Enregistrer les modifications »</strong>.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= FIXED ACTION BAR AT BOTTOM ================= */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200 py-3.5 px-4 sm:px-8 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Status Message */}
          <div className="flex items-center gap-2 text-xs">
            {hasUnsavedChanges ? (
              <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Modifications non enregistrées
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-semibold">
                <CheckCircle2 size={13} className="text-emerald-600" />
                Toutes les modifications sont enregistrées
              </span>
            )}

            {saving && (
              <span className="text-gray-600 font-medium animate-pulse ml-2">
                {uploadStatusText || 'Traitement en cours...'}
              </span>
            )}
          </div>

          {/* Action Buttons: Annuler & Enregistrer */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCancel}
              disabled={!hasUnsavedChanges || saving}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold border transition ${
                hasUnsavedChanges && !saving
                  ? 'bg-white hover:bg-gray-100 text-gray-700 border-gray-300 shadow-xs active:scale-95'
                  : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
              }`}
            >
              <X size={15} />
              <span>Annuler</span>
            </button>

            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={!hasUnsavedChanges || saving}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition ${
                hasUnsavedChanges && !saving
                  ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20 active:scale-95'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              {saving ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Enregistrement en cours...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Enregistrer les modifications</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Upload Progress Bar if active */}
        {saving && (uploadProgress.desktop > 0 || uploadProgress.mobile > 0) && (
          <div className="max-w-7xl mx-auto mt-2">
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(uploadProgress.desktop, uploadProgress.mobile)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
