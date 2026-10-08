import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../common/Button';

const HERO_SLIDES = [
  {
    image: "/images/Mucangchai3.jpg",
    headingLine1: "Tự tay trồng cây",
    headingLine2: "Từ thành phố",
    description: "Chọn thửa đất canh tác hữu cơ, lựa chọn giống rau VietGAP yêu thích và theo dõi toàn bộ hành trình sinh trưởng từ xa cùng Farmely."
  },
  {
    image: "/images/moc-chau-2811.jpg",
    headingLine1: "Nông nghiệp sạch",
    headingLine2: "Minh bạch từng luống đất",
    description: "Trực tiếp giám sát qua trạm IoT vi khí hậu, nhật ký canh tác điện tử của công nhân và nhận hướng dẫn 1-1 từ chuyên gia nông nghiệp."
  },
  {
    image: "/images/mu-cang-chai-thang-8-2-1006.webp",
    headingLine1: "Nông sản tươi sạch",
    headingLine2: "Trao tận tay bạn",
    description: "Cân đo sản lượng bằng cân điện tử, kiểm định chất lượng minh bạch và giao tận cửa nhà hoặc tự tay đến vườn thu hoạch cuối tuần."
  }
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const slide = HERO_SLIDES[currentSlide];

  return (
    <section className="relative w-full h-screen min-h-[680px] flex items-center justify-center overflow-hidden">
      {/* Background Images from local images folder with smooth fade */}
      {HERO_SLIDES.map((item, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
            idx === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
          }`}
          style={{
            backgroundImage: `url('${item.image}')`,
            transition: 'opacity 1s ease-in-out, transform 8s ease-out'
          }}
        />
      ))}

      {/* Dark green translucent overlay matching reference screenshot */}
      <div className="absolute inset-0 hero-overlay" />

      {/* Decorative top atmospheric glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-72 bg-emerald-400/10 blur-3xl rounded-full pointer-events-none" />

      {/* Hero Content - Centered */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-16 sm:pt-20">
        
        {/* Eyebrow with decorative lines like in screenshot */}
        <div className="inline-flex items-center gap-3 px-4 py-1.5 mb-6 animate-fadeIn">
          <span className="w-8 h-px bg-brand-yellow/60" />
          <span className="text-xs sm:text-sm font-black tracking-widest text-brand-yellow uppercase font-heading drop-shadow-sm">
            TRẢI NGHIỆM CANH TÁC THÔNG MINH
          </span>
          <span className="w-8 h-px bg-brand-yellow/60" />
        </div>

        {/* Cinematic Heading with soft rounded typography (Nunito) */}
        <h1 className="text-hero font-heading font-black text-white text-balance drop-shadow-md tracking-tight mb-5">
          <span className="block">{slide.headingLine1}</span>
          <span className="text-brand-yellow inline-block relative mt-1">
            {slide.headingLine2}
          </span>
        </h1>

        {/* Description */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-stone-200/95 font-sans leading-relaxed mb-8 drop-shadow-sm">
          {slide.description}
        </p>

        {/* Single Primary Action Button as requested (removed "Xem cách hoạt động" and location badge) */}
        <div className="flex items-center justify-center">
          <Link to="/marketplace">
            <Button
              variant="primary"
              size="lg"
              className="uppercase tracking-wider text-sm px-9 py-4 shadow-yellow-glow font-black"
            >
              KHÁM PHÁ KHU VỰC
            </Button>
          </Link>
        </div>

      </div>

      {/* Bottom Left: Vertical Slider Dots matching screenshot */}
      <div className="absolute left-6 sm:left-12 bottom-10 z-20 flex flex-col gap-2.5">
        {HERO_SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`hero-slider-dot ${idx === currentSlide ? 'active' : ''}`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* Bottom Right: Circular Navigation Arrows matching screenshot */}
      <div className="absolute right-6 sm:right-12 bottom-10 z-20 flex items-center gap-3">
        <button
          onClick={prevSlide}
          className="hero-circular-btn"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={nextSlide}
          className="hero-circular-btn"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

    </section>
  );
}
