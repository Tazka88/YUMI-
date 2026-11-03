import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, Smartphone, Monitor, Upload, Link as LinkIcon, Check, 
  RefreshCw, Eye, Volume2, VolumeX, Save, Sparkles, HelpCircle, AlertCircle, Copy,
  Trash2, ExternalLink, Play
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { HeroVideoConfig } from '../../components/HeroVideo';

const DEFAULT_CONFIG: HeroVideoConfig = {
  enabled: false,
  mobile_video_url: '',
  mobile_poster_url: '',
  mobile_aspect_ratio: 'aspect-[4/5]',
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
  { value: 'center top', label: 'Haut / Visage (Priorité au haut)' },
  { value: 'center 25%', label: 'Tiers supérieur (25% du haut)' },
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
  const [previewTab, setPreviewTab] = useState<'mobile' | 'desktop'>('mobile');
  const [previewMuted, setPreviewMuted] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const mobileVideoRef = useRef<HTMLVideoElement | null>(null);
  const desktopVideoRef = useRef<HTMLVideoElement | null>(null);

  // Load existing configuration from /api/admin/settings
  useEffect(() => {
    fetchSettings();
  }, []);

  // Ensure preview video plays continuously on load or tab switch
  useEffect(() => {
    if (previewTab === 'mobile' && mobileVideoRef.current) {
      mobileVideoRef.current.muted = previewMuted;
      mobileVideoRef.current.play().catch(() => {});
    }
    if (previewTab === 'desktop' && desktopVideoRef.current) {
      desktopVideoRef.current.muted = previewMuted;
      desktopVideoRef.current.play().catch(() => {});
    }
  }, [previewTab, config.mobile_video_url, config.desktop_video_url, previewMuted]);

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
            setConfig({ ...DEFAULT_CONFIG, ...parsed });
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

  // Permanently delete a file from Supabase storage or local disk
  const handleDeleteMedia = async (fieldName: keyof HeroVideoConfig) => {
    const urlToDelete = config[fieldName];
    if (!urlToDelete || typeof urlToDelete !== 'string') return;

    const confirmMsg = fieldName.includes('video')
      ? 'Voulez-vous vraiment supprimer cette vidéo ? Le fichier sera définitivement effacé de votre stockage (Supabase/Serveur) pour ne pas gaspiller votre espace.'
      : 'Voulez-vous vraiment supprimer cette image de préchargement ?';

    if (!window.confirm(confirmMsg)) return;

    setDeletingField(fieldName);
    const token = localStorage.getItem('adminToken');

    try {
      // 1. Delete file from storage
      await fetch('/api/admin/delete-media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: urlToDelete })
      });

      // 2. Clear state and auto-save
      const updatedConfig = { ...config, [fieldName]: '' };
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
      toast.success('Fichier supprimé définitivement de votre stockage (Supabase/Serveur) !');
    } catch (err) {
      console.error('Deletion error:', err);
      toast.error('Erreur lors de la suppression du fichier');
    } finally {
      setDeletingField(null);
    }
  };

  // Resilient Chunked File Upload (2MB slices to strictly eliminate HTTP 413)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof HeroVideoConfig) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|avi|mkv|3gp)$/i.test(file.name);
    const maxSize = isVideo ? 150 * 1024 * 1024 : 25 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`Fichier trop volumineux (${(file.size / (1024 * 1024)).toFixed(1)} Mo). Limite : ${isVideo ? '150 Mo' : '25 Mo'}`);
      return;
    }

    setUploadingField(fieldName as string);
    setUploadProgress(0);

    const token = localStorage.getItem('adminToken');
    if (!token) {
      toast.error('Session expirée. Veuillez vous reconnecter à l\'administration.');
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
        formData.append('customName', `hero-${fieldName}`);

        const currentPct = Math.round(((i + 1) / totalChunks) * 100);
        setUploadProgress(currentPct);

        const res = await fetch('/api/admin/upload-chunk', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.error || `Erreur lors de l'envoi du fragment ${i + 1}/${totalChunks} (${res.status})`);
        }

        if (data.done && data.url) {
          finalUrl = data.url;
          break;
        }
      }

      if (finalUrl) {
        // If replacing an existing file, clean up old file from storage to avoid orphan files
        const oldUrl = config[fieldName];
        if (oldUrl && typeof oldUrl === 'string' && oldUrl !== finalUrl) {
          fetch('/api/admin/delete-media', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ url: oldUrl })
          }).catch(() => {});
        }

        const updatedConfig = { ...config, [fieldName]: finalUrl };
        setConfig(updatedConfig);
        setPreviewError(null);

        // Auto-switch to the format that was just uploaded so admin immediately sees it
        if (fieldName === 'desktop_video_url') {
          setPreviewTab('desktop');
        } else if (fieldName === 'mobile_video_url') {
          setPreviewTab('mobile');
        }

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
        toast.success(`${isVideo ? 'Vidéo' : 'Image'} téléversée et enregistrée !`);
      } else {
        throw new Error('Téléversement incomplet (URL manquante)');
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      toast.error(err.message || 'Échec du téléversement du fichier');
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
      const payload = {
        hero_video_config: JSON.stringify(config)
      };

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      toast.success('Configuration enregistrée avec succès !');
      window.dispatchEvent(new Event('zorando_sections_updated'));
    } catch (err) {
      console.error('Save failed:', err);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  // Re-use mobile video for desktop with smart crop
  const copyMobileToDesktop = () => {
    if (!config.mobile_video_url) {
      toast.error('Veuillez d\'abord ajouter une vidéo mobile');
      return;
    }
    const updated = {
      ...config,
      desktop_video_url: config.mobile_video_url
    };
    setConfig(updated);

    // Auto-save
    const token = localStorage.getItem('adminToken');
    fetch('/api/admin/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ hero_video_config: JSON.stringify(updated) })
    }).catch(() => {});

    toast.success('Vidéo mobile copiée pour le desktop avec recadrage intelligent');
  };

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <RefreshCw size={28} className="animate-spin text-orange-500" />
          <p className="text-sm font-medium">Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  const getCleanFileName = (url?: string) => {
    if (!url) return '';
    try {
      const name = url.split('/').pop()?.split('?')[0];
      return name || url;
    } catch {
      return url;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Switch */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-gray-900 text-white p-6 rounded-2xl shadow-md border border-neutral-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
                <Sparkles size={12} /> Nouveau
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Vidéos Hero Responsives</h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl">
              Lecture continue et fluide en boucle 24h/24. Détection automatique du mobile (9:16) et recadrage intelligent sur ordinateur.
            </p>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-3 bg-neutral-800/80 p-3 rounded-xl border border-neutral-700 self-start md:self-auto">
            <span className="text-xs sm:text-sm font-medium text-gray-200">
              {config.enabled ? 'Vidéo Hero Activée' : 'Vidéo Hero Désactivée (Slider actif)'}
            </span>
            <button
              type="button"
              onClick={() => {
                const newEnabled = !config.enabled;
                const updated = { ...config, enabled: newEnabled };
                setConfig(updated);
                // Auto-save toggle
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

      {/* Main Grid: Form Left (60%), Preview Right (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Inputs & Settings */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Vidéo Mobile (9:16) */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Smartphone size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">1. Vidéo Mobile (Smartphone 9:16)</h3>
                  <p className="text-xs text-gray-500">Diffusée en boucle continue sur smartphones (&lt; 768px)</p>
                </div>
              </div>
            </div>

            {/* If Mobile Video is already configured: show active card with delete & replace */}
            {config.mobile_video_url ? (
              <div className="bg-orange-50/60 border border-orange-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0 animate-pulse" />
                    <span className="text-xs font-semibold text-gray-900 truncate">
                      {getCleanFileName(config.mobile_video_url)}
                    </span>
                  </div>
                  <a
                    href={config.mobile_video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1 font-medium shrink-0"
                    title="Ouvrir dans un nouvel onglet"
                  >
                    <span>Tester</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-orange-200/60">
                  {/* Replace Button */}
                  <label className="cursor-pointer bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-gray-300 shadow-2xs transition">
                    <RefreshCw size={13} className={uploadingField === 'mobile_video_url' ? 'animate-spin' : ''} />
                    <span>{uploadingField === 'mobile_video_url' ? `Envoi : ${uploadProgress}%` : 'Changer / Remplacer'}</span>
                    <input
                      type="file"
                      accept="video/*,.mp4,.webm,.mov,.m4v,.avi,.mkv"
                      className="hidden"
                      disabled={Boolean(uploadingField)}
                      onChange={e => handleFileUpload(e, 'mobile_video_url')}
                    />
                  </label>

                  {/* Delete Button (frees Supabase & local storage) */}
                  <button
                    type="button"
                    onClick={() => handleDeleteMedia('mobile_video_url')}
                    disabled={deletingField === 'mobile_video_url'}
                    className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                  >
                    <Trash2 size={13} />
                    <span>{deletingField === 'mobile_video_url' ? 'Suppression...' : 'Supprimer la vidéo'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Mobile Video Upload / URL Input */
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                  <span>Importer votre vidéo mobile (9:16 vertical)</span>
                  {uploadingField === 'mobile_video_url' && (
                    <span className="text-orange-600 font-semibold flex items-center gap-1.5 text-xs bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                      <RefreshCw size={12} className="animate-spin text-orange-500" />
                      <span>Envoi : {uploadProgress}%</span>
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={config.mobile_video_url || ''}
                    onChange={e => setConfig({ ...config, mobile_video_url: e.target.value })}
                    placeholder="Coller un lien (Supabase, Drive, CDN...) ou importer un fichier"
                    className="flex-1 px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                  <label className="cursor-pointer bg-orange-500 hover:bg-orange-600 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition shadow-sm shrink-0">
                    <Upload size={14} />
                    <span>Importer</span>
                    <input
                      type="file"
                      accept="video/*,.mp4,.webm,.mov,.m4v,.avi,.mkv"
                      className="hidden"
                      onChange={e => handleFileUpload(e, 'mobile_video_url')}
                    />
                  </label>
                </div>
                <p className="text-[11px] text-gray-500">
                  Formats acceptés : MP4, WebM, MOV. Envoi par fragments sécurisé sans limite 413.
                </p>
              </div>
            )}

            {/* Mobile Aspect Ratio Choice */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-gray-700">Proportions sur smartphone</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'aspect-[4/5]', label: 'Standard (4:5)', desc: 'Idéal et équilibré' },
                  { value: 'aspect-[9/16]', label: 'Plein 9:16', desc: 'Vertical complet' },
                  { value: 'h-[70vh]', label: 'Immersif (70vh)', desc: 'Haute immersion' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setConfig({ ...config, mobile_aspect_ratio: opt.value })}
                    className={`p-2 rounded-xl border text-left transition ${
                      config.mobile_aspect_ratio === opt.value
                        ? 'border-orange-500 bg-orange-50 text-orange-900 font-semibold'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[10px] text-gray-400">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Vidéo Desktop (Ordinateur) */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Monitor size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">2. Vidéo Desktop (Ordinateur)</h3>
                  <p className="text-xs text-gray-500">Vidéo horizontale ou verticale avec recadrage automatique</p>
                </div>
              </div>

              {/* Fast Copy Button */}
              {config.mobile_video_url && !config.desktop_video_url && (
                <button
                  type="button"
                  onClick={copyMobileToDesktop}
                  className="inline-flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 font-semibold bg-orange-50 hover:bg-orange-100 px-2.5 py-1.5 rounded-lg border border-orange-200 transition"
                  title="Utiliser la même vidéo verticale 9:16 avec recadrage intelligent"
                >
                  <Copy size={13} />
                  <span>Réutiliser vidéo mobile</span>
                </button>
              )}
            </div>

            {/* If Desktop Video is already configured */}
            {config.desktop_video_url ? (
              <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 animate-pulse" />
                    <span className="text-xs font-semibold text-gray-900 truncate">
                      {getCleanFileName(config.desktop_video_url)}
                    </span>
                  </div>
                  <a
                    href={config.desktop_video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium shrink-0"
                    title="Ouvrir dans un nouvel onglet"
                  >
                    <span>Tester</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-blue-200/60">
                  {/* Replace Button */}
                  <label className="cursor-pointer bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-gray-300 shadow-2xs transition">
                    <RefreshCw size={13} className={uploadingField === 'desktop_video_url' ? 'animate-spin' : ''} />
                    <span>{uploadingField === 'desktop_video_url' ? `Envoi : ${uploadProgress}%` : 'Changer / Remplacer'}</span>
                    <input
                      type="file"
                      accept="video/*,.mp4,.webm,.mov,.m4v,.avi,.mkv"
                      className="hidden"
                      disabled={Boolean(uploadingField)}
                      onChange={e => handleFileUpload(e, 'desktop_video_url')}
                    />
                  </label>

                  {/* Delete Button */}
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
              /* Desktop Video Upload / URL Input */
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                  <span>Importer votre vidéo desktop</span>
                  {uploadingField === 'desktop_video_url' && (
                    <span className="text-orange-600 font-semibold flex items-center gap-1.5 text-xs bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                      <RefreshCw size={12} className="animate-spin text-orange-500" />
                      <span>Envoi : {uploadProgress}%</span>
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={config.desktop_video_url || ''}
                    onChange={e => setConfig({ ...config, desktop_video_url: e.target.value })}
                    placeholder="Coller un lien (Supabase, Drive, CDN...) ou importer un fichier"
                    className="flex-1 px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                  <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition shadow-sm shrink-0">
                    <Upload size={14} />
                    <span>Importer</span>
                    <input
                      type="file"
                      accept="video/*,.mp4,.webm,.mov,.m4v,.avi,.mkv"
                      className="hidden"
                      onChange={e => handleFileUpload(e, 'desktop_video_url')}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Smart Crop Selector (object-position) */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-700">
                  Recadrage intelligent Desktop (<code className="text-orange-600 text-[11px]">object-position</code>)
                </label>
                <span className="text-[11px] text-gray-500">Conserve le sujet principal visible</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {POSITION_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setConfig({ ...config, desktop_object_position: opt.value })}
                    className={`p-2 rounded-xl border text-left transition ${
                      (config.desktop_object_position || 'center center') === opt.value
                        ? 'border-blue-500 bg-blue-50 text-blue-900 font-semibold'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <div className="text-xs font-medium">{opt.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Textes, Habillage & CTA Optionnels */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            <h3 className="text-base font-bold text-gray-900 pb-2 border-b border-gray-100">
              3. Textes d'Accroche & Bouton d'Action (Optionnel)
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
                  placeholder="Ex: Découvrez les dernières tendances à prix doux"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Texte du bouton CTA</label>
                <input
                  type="text"
                  value={config.button_text || ''}
                  onChange={e => setConfig({ ...config, button_text: e.target.value })}
                  placeholder="Ex: Voir les produits"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Lien du bouton</label>
                <input
                  type="text"
                  value={config.button_link || ''}
                  onChange={e => setConfig({ ...config, button_link: e.target.value })}
                  placeholder="Ex: /category/mode ou /category/all"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Voile Sombre Slider */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-700">
                  Intensité du voile sombre (Overlay de contraste) : <span className="text-orange-600 font-bold">{config.overlay_opacity ?? 25}%</span>
                </label>
                <span className="text-[11px] text-gray-400">Recommandé : 20% - 35% pour faire ressortir le texte</span>
              </div>
              <input
                type="range"
                min="0"
                max="65"
                value={config.overlay_opacity ?? 25}
                onChange={e => setConfig({ ...config, overlay_opacity: Number(e.target.value) })}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>

            {/* Sound Control Toggle */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-xs font-semibold text-gray-700">Bouton de contrôle du son</span>
                <p className="text-[11px] text-gray-400">Affiche une icône discrète pour couper ou activer le son</p>
              </div>
              <input
                type="checkbox"
                checked={config.show_sound_control ?? true}
                onChange={e => setConfig({ ...config, show_sound_control: e.target.checked })}
                className="w-4 h-4 text-orange-500 rounded focus:ring-orange-400"
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
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Eye size={18} className="text-gray-600" />
                <h3 className="text-sm font-bold text-gray-900">Aperçu en Direct</h3>
              </div>
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPreviewTab('mobile')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    previewTab === 'mobile' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Smartphone size={13} />
                  <span>Smartphone (9:16)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('desktop')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    previewTab === 'desktop' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Monitor size={13} />
                  <span>Desktop</span>
                </button>
              </div>
            </div>

            {/* Preview Frames: Both kept mounted in DOM so tab switching does not freeze or reset playback */}
            <div className="mt-4 flex flex-col items-center">
              
              {/* 1. Mobile Phone Frame (9:16 Mockup) */}
              <div className={`w-[260px] sm:w-[280px] bg-neutral-900 rounded-[32px] p-2.5 shadow-2xl border-4 border-neutral-700 ${previewTab === 'mobile' ? 'block' : 'hidden'}`}>
                <div className="relative rounded-[24px] overflow-hidden bg-black aspect-[9/16]">
                  {config.mobile_video_url ? (
                    <video
                      key={`mobile-preview-${config.mobile_video_url}`}
                      ref={mobileVideoRef}
                      src={config.mobile_video_url}
                      autoPlay
                      muted={previewMuted}
                      loop
                      playsInline
                      preload="auto"
                      onLoadedMetadata={(e) => {
                        const v = e.currentTarget;
                        v.muted = previewMuted;
                        v.play().catch(() => {});
                      }}
                      onCanPlay={(e) => {
                        const v = e.currentTarget;
                        v.muted = previewMuted;
                        v.play().catch(() => {});
                      }}
                      onPause={(e) => {
                        e.currentTarget.play().catch(() => {});
                      }}
                      onError={() => {
                        setPreviewError("Erreur de chargement du flux vidéo mobile.");
                      }}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 text-center p-4">
                      <Video size={32} className="mb-2 opacity-50" />
                      <span className="text-xs">Aucune vidéo mobile sélectionnée</span>
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

                  {/* Text Preview */}
                  {(config.title || config.button_text) && (
                    <div className="absolute inset-x-3 bottom-4 text-white pointer-events-none">
                      {config.title && <div className="text-sm font-bold leading-tight drop-shadow">{config.title}</div>}
                      {config.subtitle && <div className="text-[10px] text-gray-200 mt-1 line-clamp-1 drop-shadow">{config.subtitle}</div>}
                      {config.button_text && (
                        <div className="mt-2 inline-block bg-orange-500 text-white text-[10px] font-semibold px-3 py-1 rounded-full shadow">
                          {config.button_text}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Desktop Preview Frame (Simulates Hero Section ratio ~16:9 / ~384px) */}
              <div className={`w-full bg-neutral-900 rounded-xl p-2 shadow-xl border border-neutral-700 ${previewTab === 'desktop' ? 'block' : 'hidden'}`}>
                <div className="flex items-center gap-1.5 pb-1.5 px-2 border-b border-neutral-800 text-[10px] text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-red-500/80" />
                  <div className="w-2 h-2 rounded-full bg-yellow-500/80" />
                  <div className="w-2 h-2 rounded-full bg-green-500/80" />
                  <span className="ml-2 font-mono text-[9px]">Aperçu Recadrage Desktop ({config.desktop_object_position || 'center center'})</span>
                </div>
                <div className="relative rounded-lg overflow-hidden bg-black aspect-[16/9] mt-1.5">
                  {(config.desktop_video_url || config.mobile_video_url) ? (
                    <video
                      key={`desktop-preview-${config.desktop_video_url || config.mobile_video_url}`}
                      ref={desktopVideoRef}
                      src={config.desktop_video_url || config.mobile_video_url}
                      autoPlay
                      muted={previewMuted}
                      loop
                      playsInline
                      preload="auto"
                      onLoadedMetadata={(e) => {
                        const v = e.currentTarget;
                        v.muted = previewMuted;
                        v.play().catch(() => {});
                      }}
                      onCanPlay={(e) => {
                        const v = e.currentTarget;
                        v.muted = previewMuted;
                        v.play().catch(() => {});
                      }}
                      onPause={(e) => {
                        e.currentTarget.play().catch(() => {});
                      }}
                      onError={() => {
                        setPreviewError("Erreur de chargement du flux vidéo desktop.");
                      }}
                      className="w-full h-full object-cover"
                      style={{ objectPosition: config.desktop_object_position || 'center center' }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 text-center p-4">
                      <Monitor size={32} className="mb-2 opacity-50" />
                      <span className="text-xs">Aucune vidéo desktop sélectionnée</span>
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

                  {/* Text Preview */}
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

              {/* Status and Diagnostic Controls Bar */}
              <div className="w-full mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-medium">Lecture continue (Boucle infinie sans pause)</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Sound Preview Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const newMuted = !previewMuted;
                      setPreviewMuted(newMuted);
                      if (mobileVideoRef.current) mobileVideoRef.current.muted = newMuted;
                      if (desktopVideoRef.current) desktopVideoRef.current.muted = newMuted;
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
                      if (previewTab === 'mobile' && mobileVideoRef.current) {
                        mobileVideoRef.current.load();
                        mobileVideoRef.current.play().catch(() => {});
                      }
                      if (previewTab === 'desktop' && desktopVideoRef.current) {
                        desktopVideoRef.current.load();
                        desktopVideoRef.current.play().catch(() => {});
                      }
                      toast.success('Aperçu rechargé !');
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
                <strong>Conseil :</strong> Sur ordinateur, la vidéo tourne en continu sans bouton pause. Vous pouvez tester les options de recadrage dans la liste pour conserver votre sujet ou produit toujours centré.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
