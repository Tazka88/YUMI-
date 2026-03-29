import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SliderImage {
  id: number;
  image_url: string;
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

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await fetch('/api/slider-images', { priority: 'high' } as any);
        const data: SliderImage[] = await res.json();
        
        const activeSlides = data.filter(s => s.is_active);
        
        // Filter by category
        let categorySlides = activeSlides.filter(s => s.category_id === categoryId);
        
        // Fallback to global if no slides for this category
        if (categorySlides.length === 0) {
          categorySlides = activeSlides.filter(s => s.category_id === null);
        }
        
        setSlides(categorySlides.sort((a, b) => a.position - b.position));
      } catch (err) {
        console.error('Failed to fetch slides', err);
      }
    };

    fetchSlides();
  }, [categoryId]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  if (slides.length === 0) {
    return (
      <div className="mb-8 rounded-xl overflow-hidden shadow-md relative h-[300px] md:h-[450px] lg:h-[500px] bg-gray-200 animate-pulse">
        {/* Skeleton loader for the slider */}
      </div>
    );
  }

  return (
    <div className="mb-8 rounded-xl overflow-hidden shadow-md relative h-[300px] md:h-[450px] lg:h-[500px] group">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <img 
            src={slide.image_url} 
            alt={slide.title || "Slide"} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "auto"}
          />
          {(slide.title || slide.description || slide.button_text) && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-center p-6">
              <div className="max-w-3xl text-white">
                {slide.title && <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-4 drop-shadow-lg leading-tight">{slide.title}</h2>}
                {slide.description && <p className="text-lg md:text-xl lg:text-2xl mb-8 drop-shadow-md font-medium opacity-90">{slide.description}</p>}
                {slide.button_text && (
                  <Link 
                    to={slide.button_link || '#'} 
                    className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 md:px-10 rounded-full transition-transform hover:scale-105 shadow-xl text-lg"
                  >
                    {slide.button_text}
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {slides.length > 1 && (
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
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {slides.map((_, index) => (
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
