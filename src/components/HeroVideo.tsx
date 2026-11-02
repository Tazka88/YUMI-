import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface HeroVideoConfig {
  enabled?: boolean;
  mobile_video_url?: string;
  mobile_poster_url?: string;
  desktop_video_url?: string;
  desktop_poster_url?: string;
  desktop_object_position?: string;
  mobile_aspect_ratio?: string;
  title?: string;
  subtitle?: string;
  button_text?: string;
  button_link?: string;
  overlay_opacity?: number;
  show_sound_control?: boolean;
}

interface HeroVideoProps {
  config: HeroVideoConfig;
  fallback?: React.ReactNode;
}

export default function HeroVideo({ config, fallback }: HeroVideoProps) {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Responsive device detection listener
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
      setIsVideoLoaded(false); // Reset loaded state when switching breakpoint
    };

    setIsMobile(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // Determine active media URLs based on current device
  const currentVideoUrl = isMobile 
    ? (config.mobile_video_url || config.desktop_video_url || '')
    : (config.desktop_video_url || config.mobile_video_url || '');

  const currentPosterUrl = isMobile 
    ? (config.mobile_poster_url || config.desktop_poster_url || '')
    : (config.desktop_poster_url || config.mobile_poster_url || '');

  const objectPosition = !isMobile && config.desktop_object_position 
    ? config.desktop_object_position 
    : 'center center';

  // Toggle Mute / Sound
  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const newMutedState = !isMuted;
    videoRef.current.muted = newMutedState;
    setIsMuted(newMutedState);
    if (!newMutedState && videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // Toggle Play / Pause
  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // If no video URL or fatal playback error and fallback exists, show fallback
  if ((!currentVideoUrl && !currentPosterUrl) || (hasError && fallback)) {
    return <>{fallback || null}</>;
  }

  // Calculate overlay opacity (0 to 60)
  const overlayOpacity = Math.min(Math.max(Number(config.overlay_opacity ?? 25), 0), 75) / 100;

  // Mobile container height/aspect classes
  const mobileContainerClass = config.mobile_aspect_ratio === 'aspect-[9/16]'
    ? 'aspect-[9/16]'
    : config.mobile_aspect_ratio === 'h-[70vh]'
    ? 'h-[65vh] min-h-[440px]'
    : 'aspect-[4/5] sm:aspect-[4/5]';

  return (
    <div 
      className={`relative w-full rounded-2xl overflow-hidden shadow-sm group select-none bg-neutral-900 ${mobileContainerClass} md:aspect-[1600/500] lg:h-full lg:aspect-auto`}
      style={{ contentVisibility: 'visible', contain: 'layout paint' }}
    >
      {/* 1. Fast LCP Poster Image (displays instantly before video loads) */}
      {currentPosterUrl && (
        <img
          src={currentPosterUrl}
          alt={config.title || "ZORANDO Hero"}
          loading="eager"
          fetchPriority="high"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out pointer-events-none ${
            isVideoLoaded ? 'opacity-0 z-0' : 'opacity-100 z-10'
          }`}
          style={{ objectPosition }}
        />
      )}

      {/* 2. Device-specific Video Element (ONLY loaded for active device) */}
      {currentVideoUrl && !hasError && (
        <video
          key={currentVideoUrl} // Remounts cleanly when switching device source
          ref={videoRef}
          src={currentVideoUrl}
          poster={currentPosterUrl || undefined}
          autoPlay
          muted={isMuted}
          loop
          playsInline
          preload="metadata"
          onCanPlay={() => setIsVideoLoaded(true)}
          onPlaying={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={() => {
            console.warn('Hero video failed to load, falling back to poster');
            setHasError(true);
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
            isVideoLoaded ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
          style={{ objectPosition }}
        />
      )}

      {/* 3. Gradient Overlay for Typography Contrast & Visual Depth */}
      <div 
        className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-300"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
          backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.3) 100%)'
        }}
      />

      {/* 4. Content / Caption / Call-To-Action (if configured) */}
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

      {/* 5. Minimalist Glassmorphic Interactive Controls (Bottom Right) */}
      <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-30 flex items-center gap-2 pointer-events-auto">
        {/* Play/Pause Button */}
        {currentVideoUrl && !hasError && (
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Mettre en pause' : 'Reprendre la lecture'}
            title={isPlaying ? 'Pause' : 'Lecture'}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 border border-white/20 hover:scale-105 active:scale-95 shadow-md"
          >
            {isPlaying ? <Pause size={14} className="sm:w-4 sm:h-4" /> : <Play size={14} className="sm:w-4 sm:h-4 ml-0.5" />}
          </button>
        )}

        {/* Mute/Sound Button */}
        {currentVideoUrl && !hasError && (config.show_sound_control ?? true) && (
          <button
            type="button"
            onClick={toggleSound}
            aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
            title={isMuted ? 'Activer le son' : 'Couper le son'}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 border border-white/20 hover:scale-105 active:scale-95 shadow-md"
          >
            {isMuted ? <VolumeX size={14} className="sm:w-4 sm:h-4" /> : <Volume2 size={14} className="sm:w-4 sm:h-4 text-orange-400" />}
          </button>
        )}
      </div>
    </div>
  );
}
