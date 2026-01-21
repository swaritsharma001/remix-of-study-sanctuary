import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, GraduationCap } from 'lucide-react';
import banner1 from '@/assets/banner-1.jpg';
import banner2 from '@/assets/banner-2.jpg';
import banner3 from '@/assets/banner-3.jpg';

interface Banner {
  id: number;
  image?: string;
  title: string;
  subtitle: string;
  cta?: string;
  isAnnouncement?: boolean;
  gradient?: string;
  icon?: 'sparkles' | 'graduation';
}

const banners: Banner[] = [
  {
    id: 1,
    image: banner1,
    title: 'Learn from Next Topper',
    subtitle: 'and become a Topper',
    cta: 'Start Learning',
  },
  {
    id: 2,
    image: banner2,
    title: 'Become a Topper',
    subtitle: 'With our expert-curated courses',
    cta: 'Explore Courses',
  },
  {
    id: 3,
    image: banner3,
    title: 'All Subjects Available',
    subtitle: 'Hindi, English, Maths, Science & more',
    cta: 'Browse Subjects',
  },
  {
    id: 4,
    title: 'Class 9 Batch',
    subtitle: 'Coming Soon!',
    isAnnouncement: true,
    gradient: 'from-primary via-primary/80 to-secondary',
    icon: 'sparkles',
  },
  {
    id: 5,
    title: 'We Offer Only 2 Class Batches',
    subtitle: 'Class 9 & Class 10',
    isAnnouncement: true,
    gradient: 'from-secondary via-secondary/80 to-primary',
    icon: 'graduation',
  },
];

const BannerCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl shadow-card-hover"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Banner slides - taller aspect ratios for better image visibility */}
      <div className="relative aspect-[16/9] sm:aspect-[16/7] md:aspect-[16/6] lg:aspect-[21/9]">
        <AnimatePresence mode="wait">
          <motion.div
            key={banners[currentIndex].id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            {banners[currentIndex].isAnnouncement ? (
              <div className={`w-full h-full bg-gradient-to-br ${banners[currentIndex].gradient} flex flex-col items-center justify-center text-white p-6`}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', damping: 12 }}
                  className="mb-4"
                >
                  {banners[currentIndex].icon === 'sparkles' ? (
                    <Sparkles className="w-12 h-12 md:w-16 md:h-16 text-white/90" />
                  ) : (
                    <GraduationCap className="w-12 h-12 md:w-16 md:h-16 text-white/90" />
                  )}
                </motion.div>
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl md:text-4xl lg:text-5xl font-bold text-center mb-2"
                >
                  {banners[currentIndex].title}
                </motion.h2>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg md:text-2xl lg:text-3xl font-medium text-white/90 text-center"
                >
                  {banners[currentIndex].subtitle}
                </motion.p>
              </div>
            ) : (
              <img
                src={banners[currentIndex].image}
                alt={banners[currentIndex].title}
                className="w-full h-full object-cover"
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-white" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-white" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'w-8 bg-white'
                : 'w-2 bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <motion.div
          key={currentIndex}
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 5, ease: 'linear' }}
          className="h-full bg-gradient-to-r from-primary to-secondary"
          style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
        />
      </div>
    </div>
  );
};

export default BannerCarousel;
