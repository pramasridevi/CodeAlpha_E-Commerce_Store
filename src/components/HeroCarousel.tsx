import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, ArrowRight, Zap, ShoppingBag, ShieldCheck } from 'lucide-react';

interface PromoSlide {
  image: string;
  badge: string;
  title: string;
  highlight: string;
  subtitle: string;
  ctaText: string;
  themeColor: string;
  gradient: string;
  category: string;
}

const CAROUSEL_SLIDES: PromoSlide[] = [
  {
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200&auto=format&fit=crop',
    badge: 'Limited Time Deal',
    title: 'Acoustic Perfection Remixed',
    highlight: 'Sony WH-1000XM5 Series',
    subtitle: 'Step into premium quietness with custom smart Active Noise Cancelling.',
    ctaText: 'Buy Now & Save 15%',
    themeColor: 'from-amber-500 to-orange-600',
    gradient: 'rgba(251, 146, 60, 0.95)',
    category: 'Electronics'
  },
  {
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop',
    badge: 'Trending Fitness',
    title: 'Run on Absolute Air Cushioning',
    highlight: 'Nike Air Max Stealth Edition',
    subtitle: 'Ultralight feel and dynamic speed response coordinates for modern athletes.',
    ctaText: 'Browse Athletics Catalog',
    themeColor: 'from-orange-500 to-red-600',
    gradient: 'rgba(239, 68, 68, 0.95)',
    category: 'Fashion'
  },
  {
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=1200&auto=format&fit=crop',
    badge: 'New Innovation',
    title: 'Forged in Aerospace Titanium',
    highlight: 'Apple iPhone 15 Pro Max',
    subtitle: 'The ultimate smart hardware experience loaded with A17 Pro high-definition gaming chip.',
    ctaText: 'Up to $800 Trade-In Value',
    themeColor: 'from-slate-700 to-slate-900',
    gradient: 'rgba(15, 23, 42, 0.95)',
    category: 'Electronics'
  }
];

interface HeroProps {
  onSelectCategory: (category: string) => void;
  onExplore: () => void;
}

export default function HeroCarousel({ onSelectCategory, onExplore }: HeroProps) {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);
  };

  const handleNext = () => {
    setCurrentIdx((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
  };

  return (
    <div className="relative w-full h-[360px] md:h-[420px] overflow-hidden rounded-sm shadow-md border border-gray-150 dark:border-slate-800 bg-slate-900 group">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${CAROUSEL_SLIDES[currentIdx].image})` }}
        >
          {/* Authentic Gradient overlays mimicking professional retail sliders */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-transparent flex items-center">
            <div className="max-w-xl p-6 sm:p-10 md:p-12 text-white">
              <motion.span 
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r ${CAROUSEL_SLIDES[currentIdx].themeColor} text-white font-bold text-2s uppercase tracking-wider rounded-sm mb-4 shadow-md text-[10px]`}
              >
                <Zap size={10} className="text-yellow-200" />
                {CAROUSEL_SLIDES[currentIdx].badge}
              </motion.span>

              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xl sm:text-2xl md:text-3xl font-light text-gray-200 tracking-wide mb-1 leading-tight"
              >
                {CAROUSEL_SLIDES[currentIdx].title}
              </motion.h2>

              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-none mb-4"
              >
                {CAROUSEL_SLIDES[currentIdx].highlight}
              </motion.h1>

              <motion.p 
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xs sm:text-sm text-gray-300 font-light max-w-sm mb-6 leading-relaxed"
              >
                {CAROUSEL_SLIDES[currentIdx].subtitle}
              </motion.p>

              <motion.div 
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap gap-2.5 items-center"
              >
                <button
                  onClick={() => {
                    onSelectCategory(CAROUSEL_SLIDES[currentIdx].category);
                    onExplore();
                  }}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-[#FFD814] hover:bg-[#ffe042] text-[#232f3e] rounded-sm font-bold text-xs shadow-sm cursor-pointer active:scale-98 transition-all"
                >
                  <ShoppingBag size={14} />
                  {CAROUSEL_SLIDES[currentIdx].ctaText}
                  <ArrowRight size={13} />
                </button>
                <button
                  onClick={onExplore}
                  className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 rounded-sm font-bold text-xs cursor-pointer transition-all"
                >
                  Explore Web Store
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Nav sliders indicators */}
      <button 
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/40 border border-white/15 text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer hover:bg-slate-900/60"
      >
        <ChevronLeft size={18} />
      </button>

      <button 
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/40 border border-white/15 text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer hover:bg-slate-900/60"
      >
        <ChevronRight size={18} />
      </button>

      {/* Bottom dots */}
      <div className="absolute bottom-11 right-1/2 translate-x-1/2 flex gap-1.5 z-10">
        {CAROUSEL_SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIdx(idx)}
            className={`w-2.5 h-2.5 rounded-full border border-white/15 cursor-pointer transition-all ${
              currentIdx === idx ? 'bg-[#FFD814] scale-110' : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
      
      {/* Amazon trust strip */}
      <div className="absolute bottom-0 left-0 right-0 py-2 px-4 bg-[#172337]/95 backdrop-blur-xs hidden lg:flex justify-around items-center text-[10px] text-white border-t border-white/5 font-semibold">
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-[#FFD814]" />
          100% Reliable Guarantee
        </span>
        <span className="flex items-center gap-1.5">
          <Zap size={13} className="text-[#FFD814]" />
          Ultra-Fast Reliable Home Delivery
        </span>
        <span className="flex items-center gap-1.5">
          <ShoppingBag size={13} className="text-[#FFD814]" />
          Easy 30-Day Refund/Exchange Window
        </span>
      </div>
    </div>
  );
}
