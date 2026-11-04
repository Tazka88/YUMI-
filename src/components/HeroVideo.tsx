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

  // Exclusively Video: Desktop (16:9) vs Mobile (9:16)
  // Computer: exclusively desktop_video_url (falls back to video_url if set)
  // Mobile: exclusively mobile_video_url (falls back to desktop_video_url if only 1 video provided)
  const currentVideoUrl = isMobile 
    ? (config.mobile_video_url || config.desktop_video_url || config.video_url || '')
    : (config.desktop_video_url || config.video_url || '');

  // Reset error when URL changes
  useEffect(() => {
    setHasError(false);
  }, [currentVideoUrl]);

  // Ensure continuous autoPlay whenever video source changes or component mounts
  useEffect(() => {
    if (videoRef.current && currentVideoUrl) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = isMuted;
      videoRef.current.play().catch(() => {});
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

  // If no video URL or fatal error, return null (NO image fallback anywhere)
  if (!currentVideoUrl || hasError || !config.enabled) {
    return null;
  }

  // Calculate overlay opacity (0 to 60)
  const overlayOpacity = Math.min(Math.max(Number(config.overlay_opacity ?? 20), 0), 75) / 100;

  // Aspect ratio styling:
  // Desktop: strictly 16:9 aspect-video
  // Mobile: strictly 9:16 vertical (or max height on mobile)
  const isVerticalMobile = Boolean(config.mobile_video_url) || config.mobile_aspect_ratio === 'aspect-[9/16]';
  const mobileContainerClass = isVerticalMobile
    ? 'aspect-[9/16] max-h-[78vh] mx-auto'
    : 'aspect-video';

  const desktopContainerClass = 'md:aspect-video lg:aspect-video lg:h-auto';
  const objectFitClass = config.object_fit === 'contain' ? 'object-contain bg-black' : 'object-cover';

  return (
    <div 
      className={`relative w-full rounded-2xl overflow-hidden shadow-sm group select-none bg-neutral-900 ${mobileContainerClass} ${desktopContainerClass}`}
      style={{ contentVisibility: 'visible', contain: 'layout paint' }}
    >
      {/* Exclusively Video Element (ONLY loaded for active device, never both) */}
      <video
        key={currentVideoUrl}
        ref={videoRef}
        src={currentVideoUrl}
        autoPlay
        muted={isMuted}
        loop
        playsInline
        preload="auto"
        controls={false}
        disablePictureInPicture
        onLoadedMetadata={(e) => {
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
          e.currentTarget.play().catch(() => {});
        }}
        onError={() => {
          setHasError(true);
        }}
        className={`absolute inset-0 w-full h-full ${objectFitClass} z-0 pointer-events-none`}
      />

      {/* Gradient Overlay for Typography Contrast & Visual Depth */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-300"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
          backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.25) 100%)'
        }}
      />

      {/* Content / Caption / Call-To-Action (if configured) */}
      {(config.title || config.subtitle || config.button_text) && (
        <div className="absolute inset-0 z-20 flex flex-col justify-end md:justify-center p-4 sm:p-6 md:p-10 pointer-events-none">
          <div className="w-full max-w-2xl text-white">
            {config.title && (
              <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-2 md:mb-3 drop-shadow-md">
                {config.title}
              </h2>
            )}

            {config.subtitle && (
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-white/90 font-medium mb-3 md:mb-5 line-clamp-2 drop-shadow max-w-xl">
                {config.subtitle}
              </p>
            )}

            {config.button_text && (
              <div className="pointer-events-auto inline-block">
                <Link
                  to={config.button_link || '/category/all'}
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-semibold text-xs sm:text-sm md:text-base px-5 py-2.5 sm:px-6 sm:py-3 rounded-full shadow-lg hover:shadow-orange-500/30 transition-all duration-300 group/btn"
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
