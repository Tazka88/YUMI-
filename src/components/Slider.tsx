import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getResizedImageUrl, fetchWithCache } from '../lib/utils';

interface SliderImage {
  id: number;
  image_url: string;
  mobile_image_url?: string;
  category_id: number | null;
  position: number;
  is_active: boolean;
  title?: string;
  description?: string;
  button_text?: string;
  button_link?: string;
}

interface SliderProps {
  categoryId?: number | null;
}

export default function Slider({ categoryId = null }: SliderProps) {
  const [slides, setSlides] = useState<SliderImage[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    const fetchSlides = async () => {
      setIsLoading(true);
      try {
        const data: any = await fetchWithCache('/api/hero-banners');

        const activeSlides = data.filter(s => s.is_active);

        // Filter by category
        let categorySlides = activeSlides.filter(s => s.category_id === categoryId);

        setSlides(categorySlides.sort((a, b) => a.position - b.position));
      } catch (err) {
        console.error('Failed to fetch slides', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlides();
  }, [categoryId]);

  const visibleSlides = slides.filter(slide => slide.image_url || slide.mobile_image_url);

  useEffect(() => {
    if (visibleSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === visibleSlides.length - 1 ? 0 : prev + 1));
    }, 4500);
    return () => clearInterval(timer);
  }, [visibleSlides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev === visibleSlides.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? visibleSlides.length - 1 : prev - 1));

  // Reset current slide if it exceeds visible slides length
  useEffect(() => {
    if (currentSlide >= visibleSlides.length) {
      setCurrentSlide(0);
    }
  }, [visibleSlides.length, currentSlide]);

  // Touch swipe support for mobile devices
  const minSwipeDistance = 45;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  if (isLoading) {
    return (
      <div className="mb-6 lg:mb-0 rounded-2xl overflow-hidden shadow-sm relative w-full aspect-[4/5] sm:aspect-[4/5] md:aspect-[1600/500] lg:h-full bg-gray-200 animate-pulse">
      </div>
    );
  }

  if (visibleSlides.length === 0) {
    return null;
  }

  return (
    <div 
      className="mb-6 lg:mb-0 rounded-2xl overflow-hidden shadow-sm relative w-full aspect-[4/5] sm:aspect-[4/5] md:aspect-[1600/500] lg:h-full group bg-gray-100 slider-container no-animation select-none touch-pan-y"
      style={{ contentVisibility: "visible", contain: "layout" } as React.CSSProperties}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {visibleSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 ${index === 0 && currentSlide === 0 ? "opacity-100 z-10" : `transition-opacity duration-700 ease-in-out ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}`}
          style={index === 0 && currentSlide === 0 ? { opacity: 1, zIndex: 1, visibility: "visible", animation: "none", transition: "none" } : {}}
        >
          <picture className="w-full h-full block">
            {slide.mobile_image_url ? (
              <source 
                media="(max-width: 767px)" 
                srcSet={slide.mobile_image_url.startsWith('/api/images/') ? `${getResizedImageUrl(slide.mobile_image_url, 400)} 400w, ${getResizedImageUrl(slide.mobile_image_url, 800)} 800w, ${getResizedImageUrl(slide.mobile_image_url, 1200)} 1200w` : slide.mobile_image_url} 
                sizes="100vw"
              />
            ) : (
              <source 
                media="(max-width: 767px)" 
                srcSet={slide.image_url.startsWith('/api/images/') ? `${getResizedImageUrl(slide.image_url, 400)} 400w, ${getResizedImageUrl(slide.image_url, 800)} 800w, ${getResizedImageUrl(slide.image_url, 1200)} 1200w` : slide.image_url} 
                sizes="100vw"
              />
            )}
            <source 
              media="(min-width: 768px)" 
              srcSet={slide.image_url.startsWith('/api/images/') ? `${getResizedImageUrl(slide.image_url, 800)} 800w, ${getResizedImageUrl(slide.image_url, 1200)} 1200w, ${getResizedImageUrl(slide.image_url, 1600)} 1600w, ${getResizedImageUrl(slide.image_url, 2000)} 2000w` : slide.image_url} 
              sizes="100vw"
            />
            <img 
              src={getResizedImageUrl(slide.image_url || slide.mobile_image_url, 1600)} 
              alt={slide.title || "Slide"} 
              className={`w-full h-full object-cover object-center pointer-events-none ${index === 0 ? "slider-image" : ""}`}
              referrerPolicy="no-referrer"
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
              {...(index !== 0 ? { decoding: "async" } : {})}
              style={index === 0 ? { display: "block", opacity: 1, zIndex: 1, visibility: "visible" } : {}}
            />
          </picture>
          {(slide.title || slide.description || slide.button_text) && (
            <div className="absolute inset-0 flex items-center justify-center text-center p-3 sm:p-6 md:p-8 bg-gradient-to-t from-black/50 via-transparent to-transparent md:bg-none">
              <div className="w-full max-w-2xl text-white mx-auto">
                {slide.title && (
                  <p className="text-lg sm:text-2xl md:text-4xl font-bold mb-1 md:mb-3 drop-shadow-md leading-tight">
                    {slide.title}
                  </p>
                )}
                {slide.description && (
                  <p className="text-xs sm:text-sm md:text-base mb-2 md:mb-5 drop-shadow font-medium opacity-90 max-w-xl mx-auto line-clamp-2">
                    {slide.description}
                  </p>
                )}
                {slide.button_text && (
                  <Link 
                    to={slide.button_link || '#'} 
                    className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-medium py-1.5 px-4 md:py-2.5 md:px-8 rounded-full transition-all hover:scale-105 shadow-md text-xs md:text-sm"
                  >
                    {slide.button_text}
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {visibleSlides.length > 1 && (
        <>
          {/* Navigation Arrows for Desktop */}
          <button 
            onClick={prevSlide}
            aria-label="Diapositive précédente"
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 bg-black/35 hover:bg-black/60 text-white p-2.5 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm shadow-md items-center justify-center"
          >
            <ChevronLeft size={22} />
          </button>
          <button 
            onClick={nextSlide}
            aria-label="Diapositive suivante"
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 bg-black/35 hover:bg-black/60 text-white p-2.5 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm shadow-md items-center justify-center"
          >
            <ChevronRight size={22} />
          </button>

          {/* Dots Indicator with modern pill effect */}
          <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/25 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
            {visibleSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Aller à la diapositive ${index + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  index === currentSlide 
                    ? 'w-5 sm:w-6 h-2 bg-orange-500 shadow-sm' 
                    : 'w-2 h-2 bg-white/70 hover:bg-white'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
