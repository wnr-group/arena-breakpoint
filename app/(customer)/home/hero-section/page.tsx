"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Gamepad2, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import  Navbar  from '@/components/customer/layout/NavBar';


interface SlideData {
  id: number;
  image?: string;
  video?: string;
  title: string;
  subtitle: string;
  price: string;
}

const slides: SlideData[] = [
  {
    id: 1,
    video: "/hero_video.mp4",
    title: "WELCOME TO BREAKPOINT ARENA",
    subtitle: "Experience the ultimate gaming destination with cutting-edge technology and unmatched performance.",
    price: "9.99"
  },
  {
    id: 2,
    video: "/ps5_hero.mp4",
    title: "PLAYSTATION 5 GAMING",
    subtitle: "Immerse yourself in next-gen gaming with our PlayStation 5 stations. Experience lightning-fast loading and stunning visuals.",
    price: "12.99"
  },
  {
    id: 3,
    image: "https://demo.bravisthemes.com/playhost/wp-content/uploads/2023/12/Slide2.webp",
    title: "COSMIC WARFARE",
    subtitle: "Experience high-performance servers with ultra-low latency. Dominate the galaxy with uninterrupted gameplay and dedicated resources.",
    price: "14.99"
  },
  {
    id: 4,
    image: "https://demo.bravisthemes.com/playhost/wp-content/uploads/2023/12/Slide4.webp",
    title: "NEBULA SURVIVAL",
    subtitle: "Build, explore, and survive in infinite procedurally generated universes. Our servers ensure your progress is always safe and fast.",
    price: "12.50"
  },
  {
    id: 5,
    image: "https://demo.bravisthemes.com/playhost/wp-content/uploads/2023/12/Slide1.webp",
    title: "STARFLEET COMMAND",
    subtitle: "Lead your fleet to victory. Deploy custom mods effortlessly with our one-click installer and 24/7 priority customer support.",
    price: "19.99"
  }
];

// --- Animation Variants ---
const slideVariants: Variants = {
  enter: (direction: number) => {
    return {
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    };
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => {
    return {
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0
    };
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.4 }
  }
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: "easeOut" } 
  }
};

export default function HeroCarousel() {
  const [[page, direction], setPage] = useState([0, 0]);

  // Wrap around index safely using modulo
  const currentIndex = ((page % slides.length) + slides.length) % slides.length;

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  // Auto-play functionality
  useEffect(() => {
    const timer = setInterval(() => {
      paginate(1);
    }, 10000);

    return () => clearInterval(timer);
  }, [page]); 

  return (
    <div className="relative w-full h-screen bg-[#0d0a14] overflow-hidden selection:bg-[var(--primary)] selection:text-black font-Oxanium">
      <Navbar />

      {/* Carousel Content */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={page}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.4 }
          }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Zooming Background Image or Video */}
          {slides[currentIndex].video ? (
            <video
              key={slides[currentIndex].video}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
            >
              <source src={slides[currentIndex].video} type="video/mp4" />
            </video>
          ) : (
            <motion.div
              className="absolute inset-0 w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${slides[currentIndex].image})` }}
              initial={{ scale: 1 }}
              animate={{ scale: 1.15 }}
              transition={{ duration: 10, ease: "linear" }}
            />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0a14]/90 via-[#0d0a14]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0a14]/60 via-transparent to-transparent" />

          {/* Slide Text Content */}
          <div className="absolute inset-0 flex items-center px-14 sm:px-20 md:px-40 pb-24 md:pb-0">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="max-w-3xl pt-20"
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-5 py-1.5 md:py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-6 md:mb-8">
                <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[var(--primary)] glow-primary animate-pulse" />
                <span className="text-xs md:text-sm font-medium text-white tracking-wide">Servers Are Available</span>
              </motion.div>

              <motion.h1 
                variants={fadeUp}
                className="font-Oxanium text-4xl sm:text-5xl md:text-7xl tracking-wide bg-gradient-to-b from-white via-[#f0f0f0] to-[#a0a0a0] text-transparent bg-clip-text mb-4 leading-tight md:leading-none"
                style={{ textShadow: "0 10px 30px rgba(0,0,0,0.5)" }}
              >
                {slides[currentIndex].title}
              </motion.h1>

              <motion.p 
                variants={fadeUp}
                className="font-Oxanium text-gray-300 text-sm sm:text-base md:text-lg leading-relaxed mb-6 md:mb-10 max-w-2xl font-light"
              >
                {slides[currentIndex].subtitle}
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col gap-3 md:gap-5 font-Oxanium">
                <p className="text-gray-400 font-medium tracking-wide text-sm md:text-base">Starting at</p>
                <div className="flex items-end gap-1 md:gap-2 mb-1 md:mb-2">
                  <span className="text-primary font-bold text-2xl md:text-3xl mb-1">$</span>
                  <span className="text-5xl md:text-6xl font-black text-white leading-none">{slides[currentIndex].price}</span>
                  <span className="text-primary font-medium text-sm md:text-xl mb-1 md:mb-1.5">/monthly</span>
                </div>

                <button className="w-full sm:w-fit mt-1 md:mt-2 bg-gradient-primary hover-gradient-shift glow-primary-hover text-black font-extrabold px-6 md:px-10 py-3 md:py-4 rounded-sm uppercase tracking-widest text-xs md:text-sm transition-all duration-300">
                  Order Your Game Server Now
                </button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <div className="absolute top-1/2 -translate-y-1/2 left-2 md:left-4 z-40">
        <button 
          onClick={() => paginate(-1)}
          className="p-1 md:p-3 text-primary hover:scale-110 transition-all duration-300 rounded-full group"
        >
          <ChevronLeft className="w-8 h-8 sm:w-10 sm:h-10 md:w-16 md:h-16 stroke-[1.5] group-hover:stroke-2" />
        </button>
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 right-2 md:right-4 z-40">
        <button 
          onClick={() => paginate(1)}
          className="p-1 md:p-3 text-primary hover:scale-110 transition-all duration-300 rounded-full group"
        >
          <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10 md:w-16 md:h-16 stroke-[1.5] group-hover:stroke-2" />
        </button>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-6 md:bottom-8 left-6 md:left-12 right-6 md:right-12 flex justify-center md:justify-end items-end z-40 pointer-events-none">
        <div className="flex items-baseline gap-2 font-mono bg-black/40 md:bg-transparent px-4 py-2 md:p-0 rounded-full backdrop-blur-sm md:backdrop-blur-none pointer-events-auto">
          <motion.span 
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-black text-white"
          >
            {currentIndex + 1}
          </motion.span>
          <span className="text-xl md:text-2xl font-bold text-gray-500 md:text-gray-600">/ {slides.length}</span>
        </div>
      </div>
    </div>
  );
}