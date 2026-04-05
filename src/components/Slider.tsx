import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getResizedImageUrl } from '../lib/utils';

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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchSlides = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/hero-banners');
        const data: SliderImage[] = await res.json();
        
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

  const visibleSlides = slides.filter(slide => {
    if (isMobile) {
      return !!slide.mobile_image_url;
    }
    return !!slide.image_url;
  });

  useEffect(() => {
    if (visibleSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === visibleSlides.length - 1 ? 0 : prev + 1));
    }, 4000);
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

  if (isLoading) {
    return (
      <div className="mb-8 rounded-xl overflow-hidden shadow-md relative w-full aspect-[4/5] sm:aspect-[1/1] md:aspect-[16/5] bg-gray-200 animate-pulse">
        {/* Skeleton loader for the slider */}
      </div>
    );
  }

  if (visibleSlides.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 rounded-xl overflow-hidden shadow-md relative w-full aspect-[4/5] sm:aspect-[1/1] md:aspect-[16/5] group bg-gray-100">
      {visibleSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <picture>
            {slide.mobile_image_url && (
              <source media="(max-width: 767px)" srcSet={getResizedImageUrl(slide.mobile_image_url, 800)} />
            )}
            <img 
              src={getResizedImageUrl(slide.image_url, 1600)} 
              alt={slide.title || "Slide"} 
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
            />
          </picture>
          {(slide.title || slide.description || slide.button_text) && (
            <div className="absolute inset-0 flex items-center justify-center text-center p-2 md:p-8">
              <div className="w-full max-w-2xl text-white mx-auto">
                {slide.title && (
                  <h2 className="text-lg sm:text-2xl md:text-4xl font-bold mb-1 md:mb-3 drop-shadow-md leading-tight">
                    {slide.title}
                  </h2>
                )}
                {slide.description && (
                  <p className="text-[10px] sm:text-sm md:text-base mb-2 md:mb-5 drop-shadow font-medium opacity-90 max-w-xl mx-auto line-clamp-2">
                    {slide.description}
                  </p>
                )}
                {slide.button_text && (
                  <Link 
                    to={slide.button_link || '#'} 
                    className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-medium py-1.5 px-4 md:py-2.5 md:px-8 rounded-full transition-all hover:scale-105 shadow-md text-[11px] md:text-sm"
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
          {/* Navigation Arrows */}
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={24} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {visibleSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-orange-500' : 'bg-white/50 hover:bg-white'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
