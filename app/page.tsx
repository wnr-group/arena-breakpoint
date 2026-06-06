"use client";
import HeroCarousel from "./(customer)/page";
import Testimonials from "@/components/customer/home/Testimonials";
import AvailableDevices from "@/app/(customer)/home/device/page";

import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import DemoPreview from "@/components/admin/devices/DemoPreview";
import GameCollection from "@/components/admin/devices/GameCollection";
import LandingPage from "./(customer)/page";

function AmbientCursor() {
  const cursorX = useMotionValue(-100); // Start off-screen
  const cursorY = useMotionValue(-100);

  // Snappier spring physics for a smaller, faster dot
  const springConfig = { damping: 25, stiffness: 400, mass: 0.2 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      // Offset by 20px (Half of w-10/h-10 which is 40px) to center it
      cursorX.set(e.clientX - 20);
      cursorY.set(e.clientY - 20);
    };

    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, [cursorX, cursorY]);

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 w-6 h-6 bg-[var(--primary)] rounded-full z-[9999] opacity-70 shadow-[0_0_20px_rgba(255,193,7,0.6)] mix-blend-screen"
      style={{
        x: cursorXSpring,
        y: cursorYSpring,
      }}
    />
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#060606]">
      <AmbientCursor />
      <LandingPage></LandingPage>
    </div>
  );
}