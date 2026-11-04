import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, Smartphone, Monitor, Upload, RefreshCw, Eye, Volume2, VolumeX, Save, Sparkles, 
  HelpCircle, AlertCircle, Trash2, ExternalLink, Play, Layers, CheckCircle2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { HeroVideoConfig } from '../../components/HeroVideo';

const DEFAULT_CONFIG: HeroVideoConfig = {
  enabled: true,
  video_source_mode: 'single_16_9',
  desktop_aspect_ratio: 'aspect-video',
  mobile_aspect_ratio: 'aspect-video',
  object_fit: 'cover',
  video_url: '',
  mobile_video_url: '',
  mobile_poster_url: '',
  desktop_video_url: '',
  desktop_poster_url: '',
  desktop_object_position: 'center center',
  title: '',
  subtitle: '',
  button_text: '',
  button_link: '',
  overlay_opacity: 25,
  show_sound_control: true
};

const POSITION_OPTIONS = [
  { value: 'center center', label: 'Centré (Par défaut)' },
  { value: 'center top', label: 'Haut (Priorité au haut)' },
  { value: 'center 25%', label: 'Tiers supérieur (25%)' },
  { value: 'center 35%', label: 'Centre-haut (35%)' },
  { value: 'center 65%', label: 'Centre-bas (65%)' },
  { value: 'center bottom', label: 'Bas (Priorité au bas)' },
];

export default function HeroVideoAdmin() {
  const [config, setConfig] = useState<HeroVideoConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingField, setDeletingField] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [previewTab, setPreviewTab] = useState<'desktop' | 'mobile_16_9' | 'mobile_9_16'>('desktop');
  const [previewMuted, setPreviewMuted] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [previewReloadKey, setPreviewReloadKey] = useState<number>(() => Date.now());

  const desktopVideoRef = useRef<HTMLVideoElement | null>(null);
  const mobile169VideoRef = useRef<HTMLVideoElement | null>(null);
  const mobile916VideoRef = useRef<HTMLVideoElement | null>(null);

  // Load existing configuration from /api/admin/settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
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
          try {
            const parsed = typeof rawConfig === 'string' ? JSON.parse(rawConfig) : rawConfig;
            // Normalize default to 16:9 if not set
            const normalized: HeroVideoConfig = {
              ...DEFAULT_CONFIG,
              ...parsed,
              video_source_mode: parsed.video_source_mode || (parsed.desktop_video_url && parsed.mobile_video_url && parsed.desktop_video_url !== parsed.mobile_video_url ? 'separate' : 'single_16_9'),
              desktop_aspect_ratio: parsed.desktop_aspect_ratio || 'aspect-video',
              mobile_aspect_ratio: parsed.mobile_aspect_ratio || 'aspect-video',
              object_fit: parsed.object_fit || 'cover',
            };
            setConfig(normalized);
          } catch (e) {
            console.error('Error parsing hero_video_config:', e);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load hero video settings:', err);
      toast.error('Erreur lors du chargement de la configuration');
    } finally {
      setLoading(false);
    }
  };

  // Helper to ensure video playback starts reliably
  const safePlayVideo = (vid: HTMLVideoElement | null) => {
    if (!vid) return;
    try {
      vid.muted = previewMuted;
      vid.defaultMuted = previewMuted;
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsVideoPaused(false);
            setPreviewError(null);
          })
          .catch(() => {
            // If browser blocked autoplay due to sound policy, force muted and retry
            vid.muted = true;
            vid.play()
              .then(() => {
                setIsVideoPaused(false);
                setPreviewError(null);
              })
              .catch(() => {
                setIsVideoPaused(true);
              });
          });
      }
    } catch {
      setIsVideoPaused(true);
    }
  };

  // Trigger continuous playback on tab change, mute change, or reload key
  useEffect(() => {
    const timer = setTimeout(() => {
      if (previewTab === 'desktop') {
        safePlayVideo(desktopVideoRef.current);
      } else if (previewTab === 'mobile_16_9') {
        safePlayVideo(mobile169VideoRef.current);
      } else if (previewTab === 'mobile_9_16') {
        safePlayVideo(mobile916VideoRef.current);
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [previewTab, config.desktop_video_url, config.mobile_video_url, previewMuted, previewReloadKey]);

  // Permanently delete a file from Supabase storage or local disk
  const handleDeleteMedia = async (fieldName: keyof HeroVideoConfig) => {
    const urlToDelete = config[fieldName];
    if (!urlToDelete || typeof urlToDelete !== 'string') return;

    if (!window.confirm('Voulez-vous vraiment supprimer cette vidéo ? Le fichier sera définitivement effacé du stockage pour libérer votre espace.')) {
      return;
    }

    setDeletingField(fieldName);
    const token = localStorage.getItem('adminToken');

    try {
      await fetch('/api/admin/delete-media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: urlToDelete })
      });

      const updatedConfig = { 
        ...config, 
        [fieldName]: '',
        ...(config.video_source_mode === 'single_16_9' ? { desktop_video_url: '', mobile_video_url: '', video_url: '' } : {})
      };
      setConfig(updatedConfig);

      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ hero_video_config: JSON.stringify(updatedConfig) })
      });

      window.dispatchEvent(new Event('zorando_sections_updated'));
      toast.success('Fichier définitivement supprimé du stockage !');
    } catch (err) {
      console.error('Deletion error:', err);
      toast.error('Erreur lors de la suppression du fichier');
    } finally {
      setDeletingField(null);
    }
  };

  // Chunked File Upload (2MB slices to strictly eliminate HTTP 413)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetMode: 'single' | 'desktop' | 'mobile') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|avi|mkv|3gp)$/i.test(file.name);
    const maxSize = isVideo ? 200 * 1024 * 1024 : 30 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`Fichier trop volumineux (${(file.size / (1024 * 1024)).toFixed(1)} Mo). Limite : 200 Mo`);
      return;
    }

    setUploadingField(targetMode);
    setUploadProgress(0);

    const token = localStorage.getItem('adminToken');
    if (!token) {
      toast.error('Session expirée. Veuillez vous reconnecter.');
      setUploadingField(null);
      return;
    }

    try {
      const CHUNK_SIZE = 2 * 1024 * 1024;
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const uploadId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
      let finalUrl = '';

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
        formData.append('customName', `hero-${targetMode}`);

        setUploadProgress(Math.round(((i + 1) / totalChunks) * 100));

        const res = await fetch('/api/admin/upload-chunk', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.error || `Erreur d'envoi du fragment ${i + 1}/${totalChunks}`);
        }

        if (data.done && data.url) {
          finalUrl = data.url;
          break;
        }
      }

      if (finalUrl) {
        let updatedConfig: HeroVideoConfig;

        if (targetMode === 'single') {
          updatedConfig = {
            ...config,
            video_source_mode: 'single_16_9',
            desktop_video_url: finalUrl,
            mobile_video_url: finalUrl,
            desktop_aspect_ratio: 'aspect-video',
            mobile_aspect_ratio: 'aspect-video'
          };
          setPreviewTab('desktop');
        } else if (targetMode === 'desktop') {
          updatedConfig = {
            ...config,
            desktop_video_url: finalUrl,
            desktop_aspect_ratio: config.desktop_aspect_ratio || 'aspect-video'
          };
          setPreviewTab('desktop');
        } else {
          updatedConfig = {
            ...config,
            mobile_video_url: finalUrl
          };
          setPreviewTab('mobile_16_9');
        }

        setConfig(updatedConfig);
        setPreviewError(null);
        setPreviewReloadKey(Date.now());

        // Auto-save so refreshing the page immediately shows the uploaded video!
        await fetch('/api/admin/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ hero_video_config: JSON.stringify(updatedConfig) })
        });

        window.dispatchEvent(new Event('zorando_sections_updated'));
        toast.success('Vidéo 16:9 téléversée et enregistrée avec succès !');
      } else {
        throw new Error('Téléversement incomplet');
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      toast.error(err.message || 'Échec du téléversement');
    } finally {
      setUploadingField(null);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  // Save settings manually
  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem('adminToken');
    try {
      const payloadConfig: HeroVideoConfig = {
        ...config,
        desktop_aspect_ratio: config.desktop_aspect_ratio || 'aspect-video',
        mobile_aspect_ratio: config.mobile_aspect_ratio || 'aspect-video',
        object_fit: config.object_fit || 'cover',
        // In single 16:9 mode, synchronize both URLs
        ...(config.video_source_mode === 'single_16_9' ? {
          desktop_video_url: config.desktop_video_url || config.mobile_video_url || '',
          mobile_video_url: config.desktop_video_url || config.mobile_video_url || ''
        } : {})
      };

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ hero_video_config: JSON.stringify(payloadConfig) })
      });

      if (!res.ok) throw new Error('Erreur de sauvegarde');

      setConfig(payloadConfig);
      toast.success('Configuration Hero 16:9 enregistrée !');
      window.dispatchEvent(new Event('zorando_sections_updated'));
    } catch (err) {
      console.error('Save failed:', err);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const getCleanFileName = (url?: string) => {
    if (!url) return '';
    try {
      const name = url.split('/').pop()?.split('?')[0];
      return name || url;
    } catch {
      return url;
    }
  };

  const activeMainVideo = config.desktop_video_url || config.mobile_video_url || config.video_url || '';

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <RefreshCw size={28} className="animate-spin text-orange-500" />
          <p className="text-sm font-medium">Chargement de la configuration Hero Vidéo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Switch */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-gray-900 text-white p-6 rounded-2xl shadow-md border border-neutral-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
                <Sparkles size={12} /> Format 16:9 Natif
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Vidéos Hero 16:9 Sans Coupure</h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl">
              Spécialement optimisé pour vos vidéos horizontales 16:9 (Standard YouTube / HD). 100% de la vidéo reste visible sur ordinateur et smartphone sans aucun rognage.
            </p>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-3 bg-neutral-800/80 p-3 rounded-xl border border-neutral-700 self-start md:self-auto">
            <span className="text-xs sm:text-sm font-medium text-gray-200">
              {config.enabled ? 'Vidéo Hero Activée' : 'Vidéo Hero Désactivée (Slider classique actif)'}
            </span>
            <button
              type="button"
              onClick={() => {
                const newEnabled = !config.enabled;
                const updated = { ...config, enabled: newEnabled };
                setConfig(updated);
                const token = localStorage.getItem('adminToken');
                fetch('/api/admin/settings', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({ hero_video_config: JSON.stringify(updated) })
                }).then(() => window.dispatchEvent(new Event('zorando_sections_updated'))).catch(() => {});
              }}
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

      {/* Main Grid: Form Left (55%), Preview Right (45%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Inputs & Settings */}
        <div className="lg:col-span-7 space-y-6">

          {/* Mode Selector: 1 Vidéo Unique 16:9 vs Vidéos Séparées */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-3">
            <label className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={14} className="text-orange-500" />
              <span>Choix de diffusion vidéo</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  const updated = {
                    ...config,
                    video_source_mode: 'single_16_9' as const,
                    desktop_video_url: activeMainVideo,
                    mobile_video_url: activeMainVideo,
                    desktop_aspect_ratio: 'aspect-video',
                    mobile_aspect_ratio: 'aspect-video'
                  };
                  setConfig(updated);
                  setPreviewTab('desktop');
                }}
                className={`p-3.5 rounded-xl border text-left transition ${
                  config.video_source_mode !== 'separate'
                    ? 'border-orange-500 bg-orange-50/70 text-orange-950 ring-2 ring-orange-500/20'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-gray-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Monitor size={14} className="text-orange-500" />
                    <span>Vidéo Unique 16:9 (Recommandé)</span>
                  </span>
                  {config.video_source_mode !== 'separate' && <CheckCircle2 size={14} className="text-orange-600" />}
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Une seule vidéo 16:9 s'affiche en grand sur Ordinateur et Smartphone sans aucune coupure.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setConfig({ ...config, video_source_mode: 'separate' });
                }}
                className={`p-3.5 rounded-xl border text-left transition ${
                  config.video_source_mode === 'separate'
                    ? 'border-blue-500 bg-blue-50/70 text-blue-950 ring-2 ring-blue-500/20'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-gray-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Smartphone size={14} className="text-blue-500" />
                    <span>Vidéos Séparées (Avancé)</span>
                  </span>
                  {config.video_source_mode === 'separate' && <CheckCircle2 size={14} className="text-blue-600" />}
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Une vidéo 16:9 pour PC et une vidéo verticale 9:16 (format TikTok) pour Smartphone.
                </p>
              </button>
            </div>
          </div>

          {/* Section: Upload Video Slot */}
          {config.video_source_mode !== 'separate' ? (
            /* Mode 1 : Vidéo Unique 16:9 Universelle */
            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Video size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Vidéo 16:9 Universelle (PC & Smartphone)</h3>
                    <p className="text-xs text-gray-500">Format 16:9 standard conservé à 100% sur tous les appareils</p>
                  </div>
                </div>
              </div>

              {activeMainVideo ? (
                <div className="bg-orange-50/60 border border-orange-200 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0 animate-pulse" />
                      <span className="text-xs font-semibold text-gray-900 truncate">
                        {getCleanFileName(activeMainVideo)}
                      </span>
                      <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">16:9 Actif</span>
                    </div>
                    <a
                      href={activeMainVideo}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1 font-medium shrink-0"
                    >
                      <span>Tester le flux</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-orange-200/60">
                    <label className="cursor-pointer bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-gray-300 shadow-2xs transition">
                      <RefreshCw size={13} className={uploadingField === 'single' ? 'animate-spin' : ''} />
                      <span>{uploadingField === 'single' ? `Envoi : ${uploadProgress}%` : 'Remplacer la vidéo'}</span>
                      <input
                        type="file"
                        accept="video/*,.mp4,.webm,.mov,.m4v,.avi,.mkv"
                        className="hidden"
                        disabled={Boolean(uploadingField)}
                        onChange={e => handleFileUpload(e, 'single')}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => handleDeleteMedia('desktop_video_url')}
                      disabled={deletingField === 'desktop_video_url'}
                      className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                    >
                      <Trash2 size={13} />
                      <span>{deletingField === 'desktop_video_url' ? 'Suppression...' : 'Supprimer la vidéo'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                    <span>Téléversez votre vidéo 16:9</span>
                    {uploadingField === 'single' && (
                      <span className="text-orange-600 font-semibold flex items-center gap-1.5 text-xs bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                        <RefreshCw size={12} className="animate-spin text-orange-500" />
                        <span>Envoi : {uploadProgress}%</span>
                      </span>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={config.desktop_video_url || config.mobile_video_url || ''}
                      onChange={e => setConfig({ ...config, desktop_video_url: e.target.value, mobile_video_url: e.target.value })}
                      placeholder="Lien vidéo (/uploads/... ou URL externe) ou cliquez sur Importer"
                      className="flex-1 px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                    <label className="cursor-pointer bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition shadow-sm shrink-0">
                      <Upload size={14} />
                      <span>Importer (16:9)</span>
                      <input
                        type="file"
                        accept="video/*,.mp4,.webm,.mov,.m4v,.avi,.mkv"
                        className="hidden"
                        onChange={e => handleFileUpload(e, 'single')}
                      />
                    </label>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Accepte tous formats vidéo (MP4, WebM, MOV jusqu'à 200 Mo). Téléversement par tranches sans erreur 413.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Mode 2 : Vidéos Séparées */
            <div className="space-y-4">
              {/* Vidéo PC 16:9 */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Monitor size={14} className="text-blue-500" />
                    <span>Vidéo Ordinateur (16:9 HD)</span>
                  </h4>
                </div>
                {config.desktop_video_url ? (
                  <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-900 truncate">
                      {getCleanFileName(config.desktop_video_url)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteMedia('desktop_video_url')}
                      className="text-red-600 text-xs font-medium hover:underline flex items-center gap-1"
                    >
                      <Trash2 size={12} />
                      <span>Supprimer</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={config.desktop_video_url || ''}
                      onChange={e => setConfig({ ...config, desktop_video_url: e.target.value })}
                      placeholder="URL vidéo 16:9 desktop"
                      className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg"
                    />
                    <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0">
                      <Upload size={12} />
                      <span>{uploadingField === 'desktop' ? `${uploadProgress}%` : 'Importer'}</span>
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={e => handleFileUpload(e, 'desktop')}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Vidéo Mobile 9:16 */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Smartphone size={14} className="text-orange-500" />
                    <span>Vidéo Smartphone (Format TikTok 9:16)</span>
                  </h4>
                </div>
                {config.mobile_video_url ? (
                  <div className="bg-orange-50/60 border border-orange-200 rounded-xl p-3 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-900 truncate">
                      {getCleanFileName(config.mobile_video_url)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteMedia('mobile_video_url')}
                      className="text-red-600 text-xs font-medium hover:underline flex items-center gap-1"
                    >
                      <Trash2 size={12} />
                      <span>Supprimer</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={config.mobile_video_url || ''}
                      onChange={e => setConfig({ ...config, mobile_video_url: e.target.value })}
                      placeholder="URL vidéo mobile 9:16"
                      className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg"
                    />
                    <label className="cursor-pointer bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0">
                      <Upload size={12} />
                      <span>{uploadingField === 'mobile' ? `${uploadProgress}%` : 'Importer'}</span>
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={e => handleFileUpload(e, 'mobile')}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Format & Cadrage 16:9 du Hero */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            <h3 className="text-base font-bold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
              <Sparkles size={16} className="text-orange-500" />
              <span>Proportions & Ajustement du Hero (16:9 Garanti)</span>
            </h3>

            {/* Proportions Desktop */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Format d'affichage sur Ordinateur (Desktop)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, desktop_aspect_ratio: 'aspect-video' })}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    config.desktop_aspect_ratio !== 'banner'
                      ? 'border-orange-500 bg-orange-50/70 text-orange-950 font-semibold ring-1 ring-orange-500'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <div className="text-xs font-bold">16:9 Standard HD (Recommandé)</div>
                  <div className="text-[10px] text-gray-500">Vidéo 100% visible sans aucune coupure</div>
                </button>

                <button
                  type="button"
                  onClick={() => setConfig({ ...config, desktop_aspect_ratio: 'banner' })}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    config.desktop_aspect_ratio === 'banner'
                      ? 'border-orange-500 bg-orange-50/70 text-orange-950 font-semibold ring-1 ring-orange-500'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <div className="text-xs font-bold">Bannière Panoramique (1600x500)</div>
                  <div className="text-[10px] text-gray-500">Recadre la vidéo en bandeau fin</div>
                </button>
              </div>
            </div>

            {/* Proportions Mobile */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-gray-700">Format d'affichage sur Smartphone (Mobile)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: 'aspect-video', label: '16:9 Standard', desc: '0% de rognage' },
                  { value: 'aspect-[4/5]', label: '4:5 Instagram', desc: 'Carré haut' },
                  { value: 'aspect-[9/16]', label: '9:16 TikTok', desc: 'Vertical plein' },
                  { value: 'h-[70vh]', label: '70vh Immersif', desc: 'Grand écran' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setConfig({ ...config, mobile_aspect_ratio: opt.value })}
                    className={`p-2 rounded-xl border text-left transition ${
                      (config.mobile_aspect_ratio || 'aspect-video') === opt.value
                        ? 'border-orange-500 bg-orange-50 text-orange-900 font-semibold ring-1 ring-orange-500'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[10px] text-gray-400">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cadrage / Ajustement Vidéo */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-gray-700">Ajustement de la vidéo dans le cadre</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, object_fit: 'cover' })}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    config.object_fit !== 'contain'
                      ? 'border-orange-500 bg-orange-50 text-orange-900 font-semibold ring-1 ring-orange-500'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <div className="text-xs font-bold">Remplir tout l'espace 16:9</div>
                  <div className="text-[10px] text-gray-500">Plein écran 16:9 sans marges</div>
                </button>

                <button
                  type="button"
                  onClick={() => setConfig({ ...config, object_fit: 'contain' })}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    config.object_fit === 'contain'
                      ? 'border-orange-500 bg-orange-50 text-orange-900 font-semibold ring-1 ring-orange-500'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <div className="text-xs font-bold">Ajuster sans couper (Contain)</div>
                  <div className="text-[10px] text-gray-500">Garantit 100% de visibilité absolue</div>
                </button>
              </div>
            </div>
          </div>

          {/* Section: Textes & Bouton CTA Optionnel */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            <h3 className="text-base font-bold text-gray-900 pb-2 border-b border-gray-100">
              Textes d'Accroche & Bouton d'Action (Optionnel)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Titre principal</label>
                <input
                  type="text"
                  value={config.title || ''}
                  onChange={e => setConfig({ ...config, title: e.target.value })}
                  placeholder="Ex: Nouvelle Collection 2026"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Sous-titre / Slogan</label>
                <input
                  type="text"
                  value={config.subtitle || ''}
                  onChange={e => setConfig({ ...config, subtitle: e.target.value })}
                  placeholder="Ex: Découvrez les meilleures offres à prix doux"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Texte du bouton CTA</label>
                <input
                  type="text"
                  value={config.button_text || ''}
                  onChange={e => setConfig({ ...config, button_text: e.target.value })}
                  placeholder="Ex: Découvrir nos produits"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Lien du bouton</label>
                <input
                  type="text"
                  value={config.button_link || ''}
                  onChange={e => setConfig({ ...config, button_link: e.target.value })}
                  placeholder="Ex: /category/all"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Voile Sombre Slider */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-700">
                  Voile d'assombrissement : <span className="text-orange-600 font-bold">{config.overlay_opacity ?? 25}%</span>
                </label>
                <span className="text-[11px] text-gray-400">Pour assurer la lisibilité du texte blanc</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={config.overlay_opacity ?? 25}
                onChange={e => setConfig({ ...config, overlay_opacity: Number(e.target.value) })}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="sticky bottom-4 z-20">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-bold py-3.5 px-6 rounded-2xl shadow-xl hover:shadow-orange-500/25 transition disabled:opacity-50"
            >
              {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
              <span>{saving ? 'Enregistrement en cours...' : 'Enregistrer la configuration Hero Vidéo'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Interactive Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 sticky top-6">
            <div className="flex flex-col gap-2.5 pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye size={18} className="text-orange-500" />
                  <h3 className="text-sm font-bold text-gray-900">Aperçu en Direct 16:9</h3>
                </div>
                {/* Status Badge */}
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Lecture 24/7 active</span>
                </div>
              </div>

              {/* Preview Tabs */}
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewTab('desktop');
                    setPreviewError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    previewTab === 'desktop' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Monitor size={13} />
                  <span>Ordinateur 16:9</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPreviewTab('mobile_16_9');
                    setPreviewError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    previewTab === 'mobile_16_9' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Smartphone size={13} />
                  <span>Mobile 16:9</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPreviewTab('mobile_9_16');
                    setPreviewError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    previewTab === 'mobile_9_16' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Smartphone size={13} />
                  <span>Mobile 9:16</span>
                </button>
              </div>
            </div>

            {/* Preview Frame Container */}
            <div className="mt-4 flex flex-col items-center">
              
              {/* 1. Desktop 16:9 Preview Frame */}
              <div className={`w-full bg-neutral-900 rounded-xl p-2.5 shadow-xl border border-neutral-700 ${previewTab === 'desktop' ? 'block' : 'hidden'}`}>
                <div className="flex items-center gap-1.5 pb-2 px-1 border-b border-neutral-800 text-[10px] text-gray-400">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  <span className="ml-2 font-mono text-[10px] text-gray-300">Aperçu Hero Ordinateur 16:9 (Sans Rognage)</span>
                  <span className="ml-auto text-[9px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded font-bold">16:9</span>
                </div>

                <div 
                  className="relative rounded-lg overflow-hidden bg-black aspect-video mt-2 cursor-pointer group"
                  onClick={() => {
                    if (desktopVideoRef.current) {
                      if (desktopVideoRef.current.paused) {
                        desktopVideoRef.current.play().catch(() => {});
                        setIsVideoPaused(false);
                      } else {
                        desktopVideoRef.current.pause();
                        setIsVideoPaused(true);
                      }
                    }
                  }}
                >
                  {activeMainVideo ? (
                    <video
                      key={`desktop-169-${activeMainVideo}-${previewReloadKey}`}
                      ref={desktopVideoRef}
                      src={activeMainVideo}
                      autoPlay
                      muted={previewMuted}
                      loop
                      playsInline
                      preload="auto"
                      controls={false}
                      disablePictureInPicture
                      onLoadedMetadata={(e) => safePlayVideo(e.currentTarget)}
                      onCanPlay={(e) => safePlayVideo(e.currentTarget)}
                      onPlay={() => setIsVideoPaused(false)}
                      onPause={() => setIsVideoPaused(true)}
                      onError={() => {
                        if (previewTab === 'desktop') {
                          setPreviewError("Erreur de chargement de la vidéo 16:9.");
                        }
                      }}
                      className={`w-full h-full ${config.object_fit === 'contain' ? 'object-contain' : 'object-cover'}`}
                      style={{ objectPosition: config.desktop_object_position || 'center center' }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 text-center p-4">
                      <Video size={36} className="mb-2 opacity-50" />
                      <span className="text-xs">Aucune vidéo 16:9 sélectionnée</span>
                    </div>
                  )}

                  {/* Play Overlay if paused */}
                  {isVideoPaused && activeMainVideo && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center z-30 transition">
                      <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition">
                        <Play size={20} className="ml-0.5" />
                      </div>
                      <span className="text-white text-[11px] font-semibold mt-2 bg-black/60 px-3 py-1 rounded-full border border-white/20">
                        Cliquer pour lancer la lecture
                      </span>
                    </div>
                  )}

                  {/* Overlay */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundColor: `rgba(0,0,0, ${(config.overlay_opacity ?? 25) / 100})`,
                      backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)'
                    }}
                  />

                  {/* Captions */}
                  {(config.title || config.button_text) && (
                    <div className="absolute inset-x-4 bottom-4 text-white pointer-events-none">
                      {config.title && <div className="text-base font-bold leading-tight drop-shadow">{config.title}</div>}
                      {config.subtitle && <div className="text-xs text-gray-200 mt-1 line-clamp-1 drop-shadow">{config.subtitle}</div>}
                      {config.button_text && (
                        <div className="mt-2 inline-block bg-orange-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow">
                          {config.button_text}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Mobile 16:9 (Landscape / Standard) Preview Frame */}
              <div className={`w-[320px] bg-neutral-900 rounded-[28px] p-2.5 shadow-2xl border-4 border-neutral-700 ${previewTab === 'mobile_16_9' ? 'block' : 'hidden'}`}>
                <div className="flex items-center justify-between pb-1.5 px-2 text-[10px] text-gray-400 border-b border-neutral-800">
                  <span className="font-semibold text-gray-300">Smartphone (Format 16:9 Non coupé)</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">0% Crop</span>
                </div>
                <div 
                  className="relative rounded-[20px] overflow-hidden bg-black aspect-video mt-1.5 cursor-pointer"
                  onClick={() => {
                    if (mobile169VideoRef.current) {
                      if (mobile169VideoRef.current.paused) {
                        mobile169VideoRef.current.play().catch(() => {});
                        setIsVideoPaused(false);
                      } else {
                        mobile169VideoRef.current.pause();
                        setIsVideoPaused(true);
                      }
                    }
                  }}
                >
                  {activeMainVideo ? (
                    <video
                      key={`mobile-169-${activeMainVideo}-${previewReloadKey}`}
                      ref={mobile169VideoRef}
                      src={activeMainVideo}
                      autoPlay
                      muted={previewMuted}
                      loop
                      playsInline
                      preload="auto"
                      controls={false}
                      disablePictureInPicture
                      onLoadedMetadata={(e) => safePlayVideo(e.currentTarget)}
                      onCanPlay={(e) => safePlayVideo(e.currentTarget)}
                      onPlay={() => setIsVideoPaused(false)}
                      onPause={() => setIsVideoPaused(true)}
                      className={`w-full h-full ${config.object_fit === 'contain' ? 'object-contain' : 'object-cover'}`}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 text-center p-4">
                      <Smartphone size={32} className="mb-2 opacity-50" />
                      <span className="text-xs">Aucune vidéo sélectionnée</span>
                    </div>
                  )}

                  {/* Play Overlay */}
                  {isVideoPaused && activeMainVideo && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-30">
                      <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg">
                        <Play size={18} className="ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Overlay */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundColor: `rgba(0,0,0, ${(config.overlay_opacity ?? 25) / 100})`,
                      backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)'
                    }}
                  />
                  {(config.title || config.button_text) && (
                    <div className="absolute inset-x-3 bottom-3 text-white pointer-events-none">
                      {config.title && <div className="text-xs font-bold leading-tight drop-shadow">{config.title}</div>}
                      {config.button_text && (
                        <div className="mt-1.5 inline-block bg-orange-500 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow">
                          {config.button_text}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Mobile 9:16 (Vertical TikTok / Reel) Preview Frame */}
              <div className={`w-[240px] sm:w-[260px] bg-neutral-900 rounded-[32px] p-2.5 shadow-2xl border-4 border-neutral-700 ${previewTab === 'mobile_9_16' ? 'block' : 'hidden'}`}>
                <div className="relative rounded-[24px] overflow-hidden bg-black aspect-[9/16] cursor-pointer"
                  onClick={() => {
                    if (mobile916VideoRef.current) {
                      if (mobile916VideoRef.current.paused) {
                        mobile916VideoRef.current.play().catch(() => {});
                        setIsVideoPaused(false);
                      } else {
                        mobile916VideoRef.current.pause();
                        setIsVideoPaused(true);
                      }
                    }
                  }}
                >
                  {config.mobile_video_url ? (
                    <video
                      key={`mobile-916-${config.mobile_video_url}-${previewReloadKey}`}
                      ref={mobile916VideoRef}
                      src={config.mobile_video_url}
                      autoPlay
                      muted={previewMuted}
                      loop
                      playsInline
                      preload="auto"
                      controls={false}
                      disablePictureInPicture
                      onLoadedMetadata={(e) => safePlayVideo(e.currentTarget)}
                      onCanPlay={(e) => safePlayVideo(e.currentTarget)}
                      onPlay={() => setIsVideoPaused(false)}
                      onPause={() => setIsVideoPaused(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 text-center p-4">
                      <Smartphone size={32} className="mb-2 opacity-50" />
                      <span className="text-xs">Aucune vidéo verticale 9:16</span>
                    </div>
                  )}

                  {/* Play Overlay */}
                  {isVideoPaused && config.mobile_video_url && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-30">
                      <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg">
                        <Play size={20} className="ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Overlay */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundColor: `rgba(0,0,0, ${(config.overlay_opacity ?? 25) / 100})`,
                      backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)'
                    }}
                  />
                  {(config.title || config.button_text) && (
                    <div className="absolute inset-x-3 bottom-4 text-white pointer-events-none">
                      {config.title && <div className="text-sm font-bold leading-tight drop-shadow">{config.title}</div>}
                      {config.button_text && (
                        <div className="mt-2 inline-block bg-orange-500 text-white text-[10px] font-semibold px-3 py-1 rounded-full shadow">
                          {config.button_text}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Status and Diagnostic Controls Bar */}
              <div className="w-full mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <span className="text-[11px] text-gray-500">Boucle fluide 24h/24 sans bouton pause</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Sound Preview Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const newMuted = !previewMuted;
                      setPreviewMuted(newMuted);
                      if (desktopVideoRef.current) desktopVideoRef.current.muted = newMuted;
                      if (mobile169VideoRef.current) mobile169VideoRef.current.muted = newMuted;
                      if (mobile916VideoRef.current) mobile916VideoRef.current.muted = newMuted;
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 border transition ${
                      !previewMuted ? 'bg-orange-50 text-orange-700 border-orange-300' : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'
                    }`}
                    title={previewMuted ? "Tester le son de la vidéo" : "Couper le son"}
                  >
                    {!previewMuted ? <Volume2 size={13} className="text-orange-600" /> : <VolumeX size={13} />}
                    <span>{!previewMuted ? 'Son Actif' : 'Son Coupé'}</span>
                  </button>

                  {/* Force Reload Preview */}
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewError(null);
                      setPreviewReloadKey(Date.now());
                      toast.success('Flux vidéo rechargé !');
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center gap-1 transition"
                    title="Forcer le rechargement de l'aperçu vidéo"
                  >
                    <RefreshCw size={13} />
                    <span>Recharger</span>
                  </button>
                </div>
              </div>

              {previewError && (
                <div className="w-full mt-2 p-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{previewError}</span>
                </div>
              )}
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600 flex items-start gap-2">
              <HelpCircle size={16} className="text-orange-500 shrink-0 mt-0.5" />
              <p>
                <strong>Zéro Rognage 16:9 :</strong> Le Hero Section utilise désormais le ratio 16:9 (standard vidéo HD). Vos vidéos au format 16:9 conservent 100% de leur cadre sur PC et mobile sans être coupées.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
