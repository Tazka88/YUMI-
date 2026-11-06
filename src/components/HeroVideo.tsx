import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface HeroVideoConfig {
  enabled?: boolean;
  video_source_mode?: 'separate' | 'single_16_9';
  video_url?: string;
  desktop_video_url?: string;
  mobile_video_url?: string;
  desktop_aspect_ratio?: string;
  mobile_aspect_ratio?: string;
  object_fit?: 'cover' | 'contain' | string;
  title?: string;
  subtitle?: string;
  button_text?: string;
  button_link?: string;
  overlay_opacity?: number;
  show_sound_control?: boolean;
}

interface HeroVideoProps {
  config: HeroVideoConfig;
}

export default function HeroVideo({ config }: HeroVideoProps) {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  const [isMuted, setIsMuted] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Responsive device listener
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    setIsMobile(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // Helper to resolve relative uploads to Supabase CDN or return absolute URL
  const resolveVideoUrl = (rawUrl?: string): string => {
    if (!rawUrl) return '';
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('blob:')) {
      return rawUrl;
    }
    // If relative /uploads/... path, map to Supabase Storage public CDN
    if (rawUrl.startsWith('/uploads/')) {
      const fileName = rawUrl.replace(/^\/uploads\//, '');
      return `https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/${fileName}`;
    }
    return rawUrl;
  };

  // Exclusively Video: Desktop (16:9) vs Mobile (9:16)
  // Computer: desktop_video_url (falls back to video_url or mobile_video_url)
  // Mobile: mobile_video_url (falls back to desktop_video_url or video_url)
  const chosenRawUrl = isMobile 
    ? (config.mobile_video_url || config.desktop_video_url || config.video_url || '')
    : (config.desktop_video_url || config.video_url || config.mobile_video_url || '');

  const currentVideoUrl = resolveVideoUrl(chosenRawUrl);

  // Reset error when URL changes
  useEffect(() => {
    setHasError(false);
  }, [currentVideoUrl]);

  // Ensure continuous autoPlay whenever video source changes or component mounts
  useEffect(() => {
    const vid = videoRef.current;
    if (vid && currentVideoUrl) {
      vid.defaultMuted = true;
      vid.muted = isMuted;
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // Autoplay policy handled gracefully
          console.warn('Hero video autoplay notice:', err?.message || err);
        });
      }
    }
  }, [currentVideoUrl, isMuted]);

  // Auto-resume playback if tab is hidden and restored
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Toggle Mute / Sound
  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const newMutedState = !isMuted;
    videoRef.current.muted = newMutedState;
    setIsMuted(newMutedState);
    if (!newMutedState && videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    }
  };

  // If no video URL or explicitly disabled, do not render
  if (!currentVideoUrl || !config.enabled) {
    return null;
  }

  // Calculate overlay opacity (0 to 60)
  const overlayOpacity = Math.min(Math.max(Number(config.overlay_opacity ?? 0), 0), 75) / 100;
  const hasTextContent = Boolean(config.title || config.subtitle || config.button_text);

  // Aspect ratio styling:
  // Desktop: strictly 16:9 aspect-video
  // Mobile: strictly 9:16 vertical (or 16:9 if horizontal)
  const isVerticalMobile = isMobile && (Boolean(config.mobile_video_url) || config.mobile_aspect_ratio === 'aspect-[9/16]');
  const containerAspectClass = isVerticalMobile
    ? 'aspect-[9/16] max-h-[78vh] mx-auto'
    : 'aspect-video';

  const objectFitClass = config.object_fit === 'contain' ? 'object-contain bg-black' : 'object-cover';

  const posterUrl = isVerticalMobile ? '/hero-mobile-poster.jpg' : '/hero-desktop-poster.jpg';

  return (
    <div 
      className={`relative w-full ${containerAspectClass} rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.06)] group select-none bg-neutral-900 cursor-pointer`}
      onClick={() => {
        if (videoRef.current && videoRef.current.paused) {
          videoRef.current.play().catch(() => {});
        }
      }}
    >
      {/* Exclusively Video Element (ONLY loaded for active device, never both) */}
      <video
        key={currentVideoUrl}
        ref={(el) => {
          videoRef.current = el;
          if (el) {
            el.defaultMuted = true;
            el.muted = isMuted;
            el.playsInline = true;
            if (el.paused) {
              el.play().catch(() => {});
            }
          }
        }}
        poster={posterUrl}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        controls={false}
        disablePictureInPicture
        onLoadedMetadata={(e) => {
          const vid = e.currentTarget;
          vid.defaultMuted = true;
          vid.muted = isMuted;
          vid.play().catch(() => {});
        }}
        onLoadedData={(e) => {
          const vid = e.currentTarget;
          vid.muted = isMuted;
          vid.play().catch(() => {});
        }}
        onCanPlay={(e) => {
          const vid = e.currentTarget;
          vid.muted = isMuted;
          vid.play().catch(() => {});
        }}
        onPause={(e) => {
          // If paused by browser autoplay policy, retry muted playback
          if (e.currentTarget.muted) {
            e.currentTarget.play().catch(() => {});
          }
        }}
        onError={(e) => {
          console.warn('Hero video load warning, retrying source:', e);
          if (videoRef.current) {
            videoRef.current.load();
            videoRef.current.play().catch(() => {});
          }
        }}
        className={`absolute inset-0 w-full h-full ${objectFitClass} z-0 pointer-events-none`}
      >
        <source src={currentVideoUrl} type="video/mp4" />
      </video>

      {/* Gradient Overlay for Typography Contrast & Visual Depth (only if text exists or overlay requested) */}
      {(hasTextContent || overlayOpacity > 0) && (
        <div 
          className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-300"
          style={{
            backgroundColor: overlayOpacity > 0 ? `rgba(0, 0, 0, ${overlayOpacity})` : undefined,
            backgroundImage: hasTextContent 
              ? 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.3) 100%)' 
              : undefined
          }}
        />
      )}

      {/* Content / Caption / Call-To-Action (if configured) */}
      {(config.title || config.subtitle || config.button_text) && (
        <div className="absolute inset-0 z-20 flex flex-col justify-end md:justify-center p-4 sm:p-6 md:p-8 lg:p-10 pointer-events-none">
          <div className="w-full max-w-xl lg:max-w-2xl text-white">
            {config.title && (
              <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight leading-tight mb-2 md:mb-3 drop-shadow-[0_3px_10px_rgba(0,0,0,0.85)] whitespace-pre-line">
                {config.title}
              </h2>
            )}

            {config.subtitle && (
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-white/95 font-medium mb-3 md:mb-5 line-clamp-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] max-w-lg whitespace-pre-line">
                {config.subtitle}
              </p>
            )}

            {config.button_text && (
              <div className="pointer-events-auto inline-block">
                <Link
                  to={config.button_link || '/category/all'}
                  className="inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-orange-600 active:scale-95 text-white font-bold text-xs sm:text-sm md:text-base px-5 py-2.5 sm:px-6 sm:py-3 rounded-full shadow-lg hover:shadow-[#FF6B00]/40 transition-all duration-300 group/btn"
                >
                  <span>{config.button_text}</span>
                  <ChevronRight size={16} className="transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sound Toggle Control (Bottom Right) */}
      {(config.show_sound_control ?? true) && (
        <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-30 pointer-events-auto">
          <button
            type="button"
            onClick={toggleSound}
            aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
            title={isMuted ? 'Activer le son' : 'Couper le son'}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 border border-white/20 hover:scale-105 active:scale-95 shadow-md"
          >
            {isMuted ? <VolumeX size={14} className="sm:w-4 sm:h-4" /> : <Volume2 size={14} className="sm:w-4 sm:h-4 text-orange-400" />}
          </button>
        </div>
      )}
    </div>
  );
}
