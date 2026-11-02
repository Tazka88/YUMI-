import React, { useState, useEffect } from 'react';
import { 
  Video, Smartphone, Monitor, Upload, Link as LinkIcon, Check, 
  RefreshCw, Eye, Volume2, Save, Sparkles, HelpCircle, AlertCircle, Copy
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
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'mobile' | 'desktop'>('mobile');

  // Load existing configuration from /api/admin/settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/settings', {
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

  // Upload file helper
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof HeroVideoConfig) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 100MB for video, 15MB for image
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 100 * 1024 * 1024 : 15 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`Fichier trop volumineux. Limite : ${isVideo ? '100 Mo' : '15 Mo'}`);
      return;
    }

    setUploadingField(fieldName as string);
    const token = localStorage.getItem('adminToken');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('customName', `hero-${fieldName}`);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        throw new Error('Erreur de téléversement');
      }

      const data = await res.json();
      if (data.url) {
        setConfig(prev => ({ ...prev, [fieldName]: data.url }));
        toast.success(`${isVideo ? 'Vidéo' : 'Image'} téléversée avec succès`);
      } else {
        throw new Error('URL manquante');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Échec du téléversement du fichier');
    } finally {
      setUploadingField(null);
      e.target.value = '';
    }
  };

  // Save settings
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

      toast.success('Configuration de la vidéo Hero enregistrée !');
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
    setConfig(prev => ({
      ...prev,
      desktop_video_url: prev.mobile_video_url,
      desktop_poster_url: prev.desktop_poster_url || prev.mobile_poster_url
    }));
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
              Diffusez des vidéos immersives sur la page d'accueil avec un flux 9:16 vertical adapté aux smartphones et un recadrage intelligent sur ordinateur.
            </p>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-3 bg-neutral-800/80 p-3 rounded-xl border border-neutral-700 self-start md:self-auto">
            <span className="text-xs sm:text-sm font-medium text-gray-200">
              {config.enabled ? 'Vidéo Hero Activée' : 'Vidéo Hero Désactivée (Slider actif)'}
            </span>
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

      {/* Main Grid: Form Left (60%), Preview Right (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Inputs & Settings */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Vidéo Mobile (9:16) */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                <Smartphone size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">1. Vidéo Mobile (Smartphone 9:16)</h3>
                <p className="text-xs text-gray-500">Diffusée automatiquement sur les écrans mobiles (&lt; 768px)</p>
              </div>
            </div>

            {/* Mobile Video URL / Upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                <span>Fichier Vidéo Mobile (MP4 / WebM vertical 9:16)</span>
                {uploadingField === 'mobile_video_url' && (
                  <span className="text-orange-500 flex items-center gap-1 text-[11px]">
                    <RefreshCw size={12} className="animate-spin" /> Téléversement en cours...
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={config.mobile_video_url || ''}
                  onChange={e => setConfig({ ...config, mobile_video_url: e.target.value })}
                  placeholder="https://.../video-mobile.mp4 ou /uploads/..."
                  className="flex-1 px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 transition border border-gray-300 shrink-0">
                  <Upload size={14} />
                  <span>Importer</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={e => handleFileUpload(e, 'mobile_video_url')}
                  />
                </label>
              </div>
            </div>

            {/* Mobile Poster Image (LCP optimization) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                <span>Image Affiche Poster Mobile (Recommandé pour score LCP et affichage immédiat)</span>
                {uploadingField === 'mobile_poster_url' && (
                  <span className="text-orange-500 flex items-center gap-1 text-[11px]">
                    <RefreshCw size={12} className="animate-spin" /> Téléversement...
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={config.mobile_poster_url || ''}
                  onChange={e => setConfig({ ...config, mobile_poster_url: e.target.value })}
                  placeholder="https://.../poster-mobile.webp"
                  className="flex-1 px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 transition border border-gray-300 shrink-0">
                  <Upload size={14} />
                  <span>Importer</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleFileUpload(e, 'mobile_poster_url')}
                  />
                </label>
              </div>
            </div>

            {/* Mobile Aspect Ratio Choice */}
            <div className="space-y-1.5">
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
              {config.mobile_video_url && (
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

            {/* Desktop Video URL / Upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                <span>Fichier Vidéo Desktop (MP4 / WebM)</span>
                {uploadingField === 'desktop_video_url' && (
                  <span className="text-orange-500 flex items-center gap-1 text-[11px]">
                    <RefreshCw size={12} className="animate-spin" /> Téléversement en cours...
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={config.desktop_video_url || ''}
                  onChange={e => setConfig({ ...config, desktop_video_url: e.target.value })}
                  placeholder="https://.../video-desktop.mp4 ou /uploads/..."
                  className="flex-1 px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 transition border border-gray-300 shrink-0">
                  <Upload size={14} />
                  <span>Importer</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={e => handleFileUpload(e, 'desktop_video_url')}
                  />
                </label>
              </div>
            </div>

            {/* Smart Crop Selector (object-position) */}
            <div className="space-y-1.5">
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

            {/* Desktop Poster Image */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                <span>Image Affiche Poster Desktop</span>
                {uploadingField === 'desktop_poster_url' && (
                  <span className="text-orange-500 flex items-center gap-1 text-[11px]">
                    <RefreshCw size={12} className="animate-spin" /> Téléversement...
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={config.desktop_poster_url || ''}
                  onChange={e => setConfig({ ...config, desktop_poster_url: e.target.value })}
                  placeholder="https://.../poster-desktop.webp"
                  className="flex-1 px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 transition border border-gray-300 shrink-0">
                  <Upload size={14} />
                  <span>Importer</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleFileUpload(e, 'desktop_poster_url')}
                  />
                </label>
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

            {/* Preview Frame */}
            <div className="mt-4 flex justify-center">
              {previewTab === 'mobile' ? (
                /* Mobile Phone Frame (9:16 Mockup) */
                <div className="w-[260px] sm:w-[280px] bg-neutral-900 rounded-[32px] p-2.5 shadow-2xl border-4 border-neutral-700">
                  <div className="relative rounded-[24px] overflow-hidden bg-black aspect-[9/16]">
                    {config.mobile_video_url ? (
                      <video
                        src={config.mobile_video_url}
                        poster={config.mobile_poster_url || undefined}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : config.mobile_poster_url ? (
                      <img src={config.mobile_poster_url} alt="Poster" className="w-full h-full object-cover" />
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
              ) : (
                /* Desktop Preview Frame (Simulates Hero Section ratio ~16:9 / ~384px) */
                <div className="w-full bg-neutral-900 rounded-xl p-2 shadow-xl border border-neutral-700">
                  <div className="flex items-center gap-1.5 pb-1.5 px-2 border-b border-neutral-800 text-[10px] text-gray-400">
                    <div className="w-2 h-2 rounded-full bg-red-500/80" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/80" />
                    <div className="w-2 h-2 rounded-full bg-green-500/80" />
                    <span className="ml-2 font-mono text-[9px]">Aperçu Recadrage Desktop ({config.desktop_object_position || 'center center'})</span>
                  </div>
                  <div className="relative rounded-lg overflow-hidden bg-black aspect-[16/9] mt-1.5">
                    {(config.desktop_video_url || config.mobile_video_url) ? (
                      <video
                        src={config.desktop_video_url || config.mobile_video_url}
                        poster={config.desktop_poster_url || config.mobile_poster_url || undefined}
                        autoPlay
                        muted
                        loop
                        playsInline
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
              )}
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600 flex items-start gap-2">
              <HelpCircle size={16} className="text-orange-500 shrink-0 mt-0.5" />
              <p>
                <strong>Conseil :</strong> Sur ordinateur, la vidéo utilise <code className="text-orange-600 font-mono">object-fit: cover</code>. Vous pouvez tester les options de recadrage dans la liste pour vous assurer que le visage ou le produit principal reste parfaitement cadré.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
