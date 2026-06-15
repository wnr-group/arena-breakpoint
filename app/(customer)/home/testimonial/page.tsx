"use client";

import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useMotionValueEvent, animate, useInView, Variants } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: "Bryan G.",
    role: "Server Admin",
    text: "The DDoS protection from Playhost is a lifesaver. We used to get attacked regularly, but since switching, we haven't had a single minute of downtime.",
    avatar: "https://i.pravatar.cc/150?u=bryan",
    rating: 5
  },
  {
    id: 2,
    name: "Michael S.",
    role: "Game Developer",
    text: "I've been using Playhost for my game server needs and couldn't be happier. Uptime is fantastic and the support team is always quick to assist.",
    avatar: "https://i.pravatar.cc/150?u=michael",
    rating: 5
  },
  {
    id: 3,
    name: "Robert L.",
    role: "Community Manager",
    text: "Running a game server used to be a hassle, but Playhost makes it effortless. The control panel is intuitive and maintenance is handled automatically.",
    avatar: "https://i.pravatar.cc/150?u=robert",
    rating: 5
  },
  {
    id: 4,
    name: "Jake M.",
    role: "Esports Player",
    text: "I've tried several hosting providers and Playhost is by far the best. Server performance is top-notch — zero lag even with a full lobby.",
    avatar: "https://i.pravatar.cc/150?u=jake",
    rating: 5
  },
  {
    id: 5,
    name: "Sarah T.",
    role: "Streamer",
    text: "Customer support is unparalleled. Whenever I have a question about mod installations, they reply within minutes. Highly recommend to any serious gamer.",
    avatar: "https://i.pravatar.cc/150?u=sarah",
    rating: 5
  }
];

// Scroll entrance variants
const sectionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 }
  }
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } }
};

export default function Testimonials() {
  const [singleSetWidth, setSingleSetWidth] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const [isHovering, setIsHovering] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeIndex, setActiveIndex] = useState(0);

  const x = useMotionValue(0);

  // useInView for scroll entrance
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  useEffect(() => {
    const updateWidth = () => {
      if (cardRef.current) {
        const cardWidth = cardRef.current.offsetWidth;
        const gap = 20;
        const setWidth = (cardWidth + gap) * testimonials.length;
        setSingleSetWidth(setWidth);
        x.jump(-setWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [x]);

  useMotionValueEvent(x, "change", (latestX) => {
    if (singleSetWidth === 0) return;
    if (latestX > -singleSetWidth) {
      x.jump(latestX - singleSetWidth);
      return;
    } else if (latestX <= -singleSetWidth * 2) {
      x.jump(latestX + singleSetWidth);
      return;
    }
    const positionWithinSet = Math.abs(latestX + singleSetWidth);
    const scrollPercentage = positionWithinSet / singleSetWidth;
    let index = Math.round(scrollPercentage * testimonials.length);
    if (index >= testimonials.length) index = 0;
    setActiveIndex(index);
  });

  const handleDotClick = (index: number) => {
    if (singleSetWidth === 0) return;
    const itemWidth = singleSetWidth / testimonials.length;
    const targetX = -singleSetWidth - (index * itemWidth);
    animate(x, targetX, { type: "spring", stiffness: 220, damping: 28 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const extendedTestimonials = [...testimonials, ...testimonials, ...testimonials];

  return (
    <section
      ref={sectionRef}
      className="w-full bg-[#0f0f0f] py-24 overflow-hidden relative"
    >
      {/* Custom cursor */}
      {isHovering && (
        <motion.div
          className="fixed top-0 left-0 w-16 h-16 bg-[#A855F7] rounded-full flex items-center justify-center pointer-events-none z-50 shadow-2xl hidden md:flex gap-2"
          animate={{ x: mousePosition.x - 32, y: mousePosition.y - 32 }}
          transition={{ type: "tween", ease: "backOut", duration: 0.08 }}
        >
          <svg width="10" height="12" viewBox="0 0 12 14" fill="#0a0a0a">
            <path d="M12 14L0 7L12 0V14Z" />
          </svg>
          <svg width="10" height="12" viewBox="0 0 12 14" fill="#0a0a0a">
            <path d="M0 0L12 7L0 14V0Z" />
          </svg>
        </motion.div>
      )}

      <div className="max-w-[1400px] mx-auto px-6 md:px-12">

        {/* Header — scroll entrance */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-6"
        >
          <div className="flex flex-col gap-4">
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-[#A855F7] tracking-[0.18em] uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-pulse" />
                Customer Reviews
              </span>
            </motion.div>

            <motion.h2
              variants={fadeUp}
              className="text-5xl md:text-6xl font-black text-white leading-none"
            >
              4.85{" "}
              <span className="text-2xl md:text-3xl font-bold text-zinc-500">out of 5</span>
            </motion.h2>
          </div>

          <motion.div variants={fadeUp} className="flex items-center gap-1.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-[#A855F7] text-[#A855F7]" />
            ))}
            <span className="ml-2 text-zinc-400 text-sm font-medium">Based on 2,400+ reviews</span>
          </motion.div>
        </motion.div>

        {/* Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden md:cursor-none select-none py-3"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onMouseMove={handleMouseMove}
        >
          <motion.div
            drag="x"
            dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
            style={{ x }}
            className="flex gap-5 w-max"
          >
            {extendedTestimonials.map((t, idx) => (
              <div
                ref={idx === 0 ? cardRef : null}
                key={`${t.id}-${idx}`}
                className="w-[300px] md:w-[340px] flex-shrink-0 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group"
                style={{
                  background: "linear-gradient(160deg, #1c1c1c 0%, #161616 100%)",
                  border: "1px solid #272727",
                }}
              >
                {/* Subtle top accent line */}
                <div
                  className="absolute top-0 left-6 right-6 h-[1.5px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "linear-gradient(90deg, transparent, #A855F7, transparent)" }}
                />

                {/* Quote icon */}
                <div className="absolute top-5 right-5 opacity-[0.06]">
                  <Quote className="w-14 h-14 text-[#A855F7] fill-[#A855F7]" />
                </div>

                <div className="relative z-10">
                  {/* Stars */}
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#A855F7] text-[#A855F7]" />
                    ))}
                  </div>

                  {/* Text */}
                  <p className="text-zinc-300 text-[13.5px] leading-relaxed font-light mb-6">
                    "{t.text}"
                  </p>
                </div>

                {/* Avatar + name */}
                <div className="relative z-10 flex items-center gap-3 pt-4 border-t border-white/5">
                  <div className="relative">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-[#A855F7]/30"
                      draggable="false"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#1c1c1c]" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold leading-none mb-0.5">{t.name}</p>
                    <p className="text-zinc-500 text-[11px] font-medium">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-10 flex items-center justify-center gap-2"
        >
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleDotClick(idx)}
              className="relative h-1.5 rounded-full transition-all duration-300 overflow-hidden"
              style={{
                width: activeIndex === idx ? 28 : 8,
                background: activeIndex === idx ? "#A855F7" : "rgba(255,255,255,0.15)",
              }}
            />
          ))}
        </motion.div>

      </div>
    </section>
  );
}