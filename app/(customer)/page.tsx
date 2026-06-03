
// import React, { useState, useEffect } from 'react';
// import { motion, AnimatePresence, Variants } from 'framer-motion';
// import { Gamepad2, ChevronLeft, ChevronRight, Menu } from 'lucide-react';

// // --- Types & Data ---

// interface SlideData {
//   id: number;
//   image: string;
//   title: string;
//   subtitle: string;
//   price: string;
// }

// const slides: SlideData[] = [
//   {
//     id: 1,
//     image: "https://demo.bravisthemes.com/playhost/wp-content/uploads/2023/12/Slide3.webp",
//     title: "GALACTIC ODYSSEY",
//     subtitle: "Aute esse non magna elit dolore dolor sit est. Ea occaecat ea duis laborum reprehenderit id cillum tempor cupidatat qui nisi proident nostrud dolore.",
//     price: "9.99"
//   },
//   {
//     id: 2,
//     image: "https://demo.bravisthemes.com/playhost/wp-content/uploads/2023/12/Slide2.webp",
//     title: "COSMIC WARFARE",
//     subtitle: "Experience high-performance servers with ultra-low latency. Dominate the galaxy with uninterrupted gameplay and dedicated resources.",
//     price: "14.99"
//   },
//   {
//     id: 3,
//     image: "https://demo.bravisthemes.com/playhost/wp-content/uploads/2023/12/Slide4.webp",
//     title: "NEBULA SURVIVAL",
//     subtitle: "Build, explore, and survive in infinite procedurally generated universes. Our servers ensure your progress is always safe and fast.",
//     price: "12.50"
//   },
//   {
//     id: 4,
//     image: "https://demo.bravisthemes.com/playhost/wp-content/uploads/2023/12/Slide1.webp",
//     title: "STARFLEET COMMAND",
//     subtitle: "Lead your fleet to victory. Deploy custom mods effortlessly with our one-click installer and 24/7 priority customer support.",
//     price: "19.99"
//   }
// ];

// const navLinks = [
//   { num: "1", label: "Home" },
//   { num: "2", label: "Game Servers" },
//   { num: "3", label: "Locations" },
//   { num: "4", label: "Support" },
//   { num: "5", label: "News" },
//   { num: "6", label: "Company" },
//   { num: "7", label: "More Pages" }
// ];

// // --- Animation Variants ---

// const slideVariants: Variants = {
//   enter: (direction: number) => {
//     return {
//       x: direction > 0 ? '100%' : '-100%',
//       opacity: 0
//     };
//   },
//   center: {
//     zIndex: 1,
//     x: 0,
//     opacity: 1
//   },
//   exit: (direction: number) => {
//     return {
//       zIndex: 0,
//       x: direction < 0 ? '100%' : '-100%',
//       opacity: 0
//     };
//   }
// };

// const staggerContainer: Variants = {
//   hidden: { opacity: 0 },
//   show: {
//     opacity: 1,
//     transition: { staggerChildren: 0.15, delayChildren: 0.4 }
//   }
// };

// const fadeUp: Variants = {
//   hidden: { opacity: 0, y: 40 },
//   show: { 
//     opacity: 1, 
//     y: 0, 
//     transition: { duration: 0.8, ease: "easeOut" } 
//   }
// };

// // --- Components ---

// const Navbar = () => (
//   <nav className="absolute top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-6 md:px-12 bg-gradient-to-b from-black/90 to-transparent">
//     <div className="flex items-center gap-2 cursor-pointer">
//       <Gamepad2 className="w-8 h-8 text-[var(--primary)]" />
//       <span className="text-2xl font-bold text-white tracking-wide">playhost</span>
//     </div>

//     <div className="hidden lg:flex items-center gap-8">
//       {navLinks.map((link) => (
//         <div key={link.label} className="flex flex-col items-center group cursor-pointer">
//           <span className="text-[10px] text-gray-500 font-mono mb-1 group-hover:text-[var(--primary)] transition-colors duration-300">
//             {link.num}
//           </span>
//           <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors duration-300 flex items-center gap-1">
//             {link.label}
//             <ChevronRight className="w-3 h-3 rotate-90 text-gray-500 group-hover:text-[var(--primary)] transition-colors" />
//           </span>
//         </div>
//       ))}
//     </div>

//     <div className="flex items-center gap-4">
//       <button className="hidden md:block px-6 py-2.5 border-gradient-animated text-[var(--primary)] font-bold text-xs tracking-widest uppercase hover:bg-[var(--primary)] hover:text-black transition-all duration-300">
//         Get Hosting
//       </button>
//       <button className="lg:hidden text-white hover:text-[var(--primary)] transition-colors">
//         <Menu className="w-7 h-7" />
//       </button>
//     </div>
//   </nav>
// );

// export default function HeroCarousel() {
//   // Track both the absolute page number and the direction we are moving
//   const [[page, direction], setPage] = useState([0, 0]);

//   // Wrap around index safely using modulo
//   const currentIndex = ((page % slides.length) + slides.length) % slides.length;

//   const paginate = (newDirection: number) => {
//     setPage([page + newDirection, newDirection]);
//   };

//   // Auto-play functionality
//   useEffect(() => {
//     const timer = setInterval(() => {
//       paginate(1);
//     }, 7000);
    
//     return () => clearInterval(timer);
//   }, [page]); // Reset timer if page changes manually

//   return (
//     <div className="relative w-full h-screen bg-[#0a0a0a] overflow-hidden selection:bg-[var(--primary)] selection:text-black font-sans">
//       <Navbar />

//       {/* Carousel Content */}
//       <AnimatePresence initial={false} custom={direction}>
//         <motion.div
//           key={page}
//           custom={direction}
//           variants={slideVariants}
//           initial="enter"
//           animate="center"
//           exit="exit"
//           transition={{
//             x: { type: "spring", stiffness: 300, damping: 30 },
//             opacity: { duration: 0.4 }
//           }}
//           className="absolute inset-0 w-full h-full"
//         >
//           {/* Zooming Background Image */}
//           <motion.div
//             className="absolute inset-0 w-full h-full bg-cover bg-center"
//             style={{ backgroundImage: `url(${slides[currentIndex].image})` }}
//             initial={{ scale: 1 }}
//             animate={{ scale: 1.15 }}
//             transition={{ duration: 10, ease: "linear" }}
//           />
          
//           <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
//           <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

//           {/* Slide Text Content */}
//           <div className="absolute inset-0 flex items-center px-6 md:px-24">
//             <motion.div
//               variants={staggerContainer}
//               initial="hidden"
//               animate="show"
//               className="max-w-3xl pt-20"
//             >
//               <motion.div variants={fadeUp} className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8">
//                 <span className="w-3 h-3 rounded-full bg-[var(--primary)] glow-primary animate-pulse" />
//                 <span className="text-sm font-medium text-white tracking-wide">Servers Are Available</span>
//               </motion.div>

//               <motion.h1 
//                 variants={fadeUp}
//                 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black text-white mb-6 tracking-tight leading-none uppercase"
//                 style={{ textShadow: "0 10px 30px rgba(0,0,0,0.5)" }}
//               >
//                 {slides[currentIndex].title}
//               </motion.h1>

//               <motion.p 
//                 variants={fadeUp}
//                 className="text-gray-300 text-base md:text-lg leading-relaxed mb-10 max-w-2xl font-light"
//               >
//                 {slides[currentIndex].subtitle}
//               </motion.p>

//               <motion.div variants={fadeUp} className="flex flex-col gap-5">
//                 <p className="text-gray-400 font-medium tracking-wide">Starting at</p>
//                 <div className="flex items-end gap-2 mb-2">
//                   <span className="text-[var(--primary)] font-bold text-3xl mb-1">$</span>
//                   <span className="text-7xl font-black text-white leading-none">{slides[currentIndex].price}</span>
//                   <span className="text-[var(--primary)] font-medium text-xl mb-1">/monthly</span>
//                 </div>
                
//                 <button className="w-fit mt-4 bg-gradient-primary hover-gradient-shift glow-primary-hover text-black font-extrabold px-10 py-4 rounded-[4px] uppercase tracking-widest text-sm transition-all duration-300">
//                   Order Your Game Server Now
//                 </button>
//               </motion.div>
//             </motion.div>
//           </div>
//         </motion.div>
//       </AnimatePresence>

//       {/* Navigation Arrows */}
//       <div className="absolute top-1/2 -translate-y-1/2 left-4 md:left-8 z-40">
//         <button 
//           onClick={() => paginate(-1)}
//           className="p-3 bg-black/20 backdrop-blur-sm border border-white/10 text-white/70 hover:text-[var(--primary)] hover:border-[var(--primary)] hover:scale-110 transition-all duration-300 rounded-full group"
//         >
//           <ChevronLeft className="w-8 h-8 md:w-10 md:h-10 stroke-[1.5] group-hover:stroke-2" />
//         </button>
//       </div>
//       <div className="absolute top-1/2 -translate-y-1/2 right-4 md:right-8 z-40">
//         <button 
//           onClick={() => paginate(1)}
//           className="p-3 bg-black/20 backdrop-blur-sm border border-white/10 text-white/70 hover:text-[var(--primary)] hover:border-[var(--primary)] hover:scale-110 transition-all duration-300 rounded-full group"
//         >
//           <ChevronRight className="w-8 h-8 md:w-10 md:h-10 stroke-[1.5] group-hover:stroke-2" />
//         </button>
//       </div>

//       {/* Bottom Controls */}
//       <div className="absolute bottom-8 left-6 md:left-12 right-6 md:right-12 flex justify-between items-end z-40">
//         <div className="flex  items-baseline justify-end gap-2 font-mono">
//           <motion.span 
//             key={currentIndex}
//             initial={{ opacity: 0, y: 10 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="text-5xl font-black text-white"
//           >
//             {currentIndex + 1}
//           </motion.span>
//           <span className="text-2xl font-bold text-gray-600">/ {slides.length}</span>
//         </div>
//       </div>
//     </div>
//   );
// }


// import React, { useState, useEffect } from 'react';
// import { motion, AnimatePresence, Variants } from 'framer-motion';
// import { Gamepad2, ChevronLeft, ChevronRight, Menu } from 'lucide-react';

// // --- Types & Data ---

// interface SlideData {
//   id: number;
//   image: string;
//   title: string;
//   subtitle: string;
//   price: string;
// }

// const slides: SlideData[] = [
//   {
//     id: 1,
//     image: "https://demo.bravisthemes.com/playhost/wp-content/uploads/2023/12/Slide3.webp",
//     title: "GALACTIC ODYSSEY",
//     subtitle: "Aute esse non magna elit dolore dolor sit est. Ea occaecat ea duis laborum reprehenderit id cillum tempor cupidatat qui nisi proident nostrud dolore.",
//     price: "9.99"
//   },
//   {
//     id: 2,
//     image: "https://demo.bravisthemes.com/playhost/wp-content/uploads/2023/12/Slide2.webp",
//     title: "COSMIC WARFARE",
//     subtitle: "Experience high-performance servers with ultra-low latency. Dominate the galaxy with uninterrupted gameplay and dedicated resources.",
//     price: "14.99"
//   },
//   {
//     id: 3,
//     image: "https://demo.bravisthemes.com/playhost/wp-content/uploads/2023/12/Slide4.webp",
//     title: "NEBULA SURVIVAL",
//     subtitle: "Build, explore, and survive in infinite procedurally generated universes. Our servers ensure your progress is always safe and fast.",
//     price: "12.50"
//   },
//   {
//     id: 4,
//     image: "https://demo.bravisthemes.com/playhost/wp-content/uploads/2023/12/Slide1.webp",
//     title: "STARFLEET COMMAND",
//     subtitle: "Lead your fleet to victory. Deploy custom mods effortlessly with our one-click installer and 24/7 priority customer support.",
//     price: "19.99"
//   }
// ];

// const navLinks = [
//   { num: "1", label: "Home" },
//   { num: "2", label: "Game Servers" },
//   { num: "3", label: "Locations" },
//   { num: "4", label: "Support" },
//   { num: "5", label: "News" },
//   { num: "6", label: "Company" },
//   { num: "7", label: "More Pages" }
// ];

// // --- Animation Variants ---

// const slideVariants: Variants = {
//   enter: (direction: number) => {
//     return {
//       x: direction > 0 ? '100%' : '-100%',
//       opacity: 0
//     };
//   },
//   center: {
//     zIndex: 1,
//     x: 0,
//     opacity: 1
//   },
//   exit: (direction: number) => {
//     return {
//       zIndex: 0,
//       x: direction < 0 ? '100%' : '-100%',
//       opacity: 0
//     };
//   }
// };

// const staggerContainer: Variants = {
//   hidden: { opacity: 0 },
//   show: {
//     opacity: 1,
//     transition: { staggerChildren: 0.15, delayChildren: 0.4 }
//   }
// };

// const fadeUp: Variants = {
//   hidden: { opacity: 0, y: 40 },
//   show: { 
//     opacity: 1, 
//     y: 0, 
//     transition: { duration: 0.8, ease: "easeOut" } 
//   }
// };

// // --- Components ---

// const Navbar = () => (
//   <nav className="absolute top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-6 md:px-12 bg-gradient-to-b from-black/90 to-transparent">
//     <div className="flex items-center gap-2 cursor-pointer">
//       <Gamepad2 className="w-8 h-8 text-[var(--primary)]" />
//       <span className="text-2xl font-bold text-white tracking-wide">playhost</span>
//     </div>

//     <div className="hidden lg:flex items-center gap-8">
//       {navLinks.map((link) => (
//         <div key={link.label} className="flex flex-col items-center group cursor-pointer">
//           <span className="text-[10px] text-gray-500 font-mono mb-1 group-hover:text-[var(--primary)] transition-colors duration-300">
//             {link.num}
//           </span>
//           <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors duration-300 flex items-center gap-1">
//             {link.label}
//             <ChevronRight className="w-3 h-3 rotate-90 text-gray-500 group-hover:text-[var(--primary)] transition-colors" />
//           </span>
//         </div>
//       ))}
//     </div>

//     <div className="flex items-center gap-4">
//       <button className="hidden md:block px-6 py-2.5 border-gradient-animated text-[var(--primary)] font-bold text-xs tracking-widest uppercase hover:bg-[var(--primary)] hover:text-black transition-all duration-300">
//         Get Hosting
//       </button>
//       <button className="lg:hidden text-white hover:text-[var(--primary)] transition-colors">
//         <Menu className="w-7 h-7" />
//       </button>
//     </div>
//   </nav>
// );

// export default function HeroCarousel() {
//   // Track both the absolute page number and the direction we are moving
//   const [[page, direction], setPage] = useState([0, 0]);

//   // Wrap around index safely using modulo
//   const currentIndex = ((page % slides.length) + slides.length) % slides.length;

//   const paginate = (newDirection: number) => {
//     setPage([page + newDirection, newDirection]);
//   };

//   // Auto-play functionality
//   useEffect(() => {
//     const timer = setInterval(() => {
//       paginate(1);
//     }, 7000);
    
//     return () => clearInterval(timer);
//   }, [page]); // Reset timer if page changes manually

//   return (
//     <div className="relative w-full h-screen bg-[#0a0a0a] overflow-hidden selection:bg-[var(--primary)] selection:text-black font-Oxanium">
//       <Navbar />

//       {/* Carousel Content */}
//       <AnimatePresence initial={false} custom={direction}>
//         <motion.div
//           key={page}
//           custom={direction}
//           variants={slideVariants}
//           initial="enter"
//           animate="center"
//           exit="exit"
//           transition={{
//             x: { type: "spring", stiffness: 300, damping: 30 },
//             opacity: { duration: 0.4 }
//           }}
//           className="absolute inset-0 w-full h-full"
//         >
//           {/* Zooming Background Image */}
//           <motion.div
//             className="absolute inset-0 w-full h-full bg-cover bg-center"
//             style={{ backgroundImage: `url(${slides[currentIndex].image})` }}
//             initial={{ scale: 1 }}
//             animate={{ scale: 1.15 }}
//             transition={{ duration: 10, ease: "linear" }}
//           />
          
//           <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
//           <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

//           {/* Slide Text Content */}
//           <div className="absolute inset-0 flex items-center px-6 md:px-24">
//             <motion.div
//               variants={staggerContainer}
//               initial="hidden"
//               animate="show"
//               className="max-w-3xl pt-20"
//             >
//               <motion.div variants={fadeUp} className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8">
//                 <span className="w-3 h-3 rounded-full bg-[var(--primary)] glow-primary animate-pulse" />
//                 <span className="text-sm font-medium text-white tracking-wide">Servers Are Available</span>
//               </motion.div>

//               <motion.h1 
//                 variants={fadeUp}
//                 className="font-Oxanium text-6xl md:text-6xl tracking-wide bg-gradient-to-b from-white via-[#f0f0f0] to-[#a0a0a0] text-transparent bg-clip-text mb-4"
//                 style={{ textShadow: "0 10px 30px rgba(0,0,0,0.5)" }}
//               >
//                 {slides[currentIndex].title}
//               </motion.h1>

//               <motion.p 
//                 variants={fadeUp}
//                 className="text-gray-300 text-base md:text-lg leading-relaxed mb-10 max-w-2xl font-light"
//               >
//                 {slides[currentIndex].subtitle}
//               </motion.p>

//               <motion.div variants={fadeUp} className="flex flex-col gap-5">
//                 <p className="text-gray-400 font-medium tracking-wide">Starting at</p>
//                 <div className="flex items-end gap-2 mb-2">
//                   <span className="text-[var(--primary)] font-bold text-3xl mb-1">$</span>
//                   <span className="text-7xl font-black text-white leading-none">{slides[currentIndex].price}</span>
//                   <span className="text-[var(--primary)] font-medium text-xl mb-1">/monthly</span>
//                 </div>
                
//                 <button className="w-fit mt-4 bg-gradient-primary hover-gradient-shift glow-primary-hover text-black font-extrabold px-10 py-4 rounded-[4px] uppercase tracking-widest text-sm transition-all duration-300">
//                   Order Your Game Server Now
//                 </button>
//               </motion.div>
//             </motion.div>
//           </div>
//         </motion.div>
//       </AnimatePresence>

//       {/* Navigation Arrows */}
//       <div className="absolute top-1/2 -translate-y-1/2 left-4 md:left-8 z-40">
//         <button 
//           onClick={() => paginate(-1)}
//           className="p-3 bg-black/20 backdrop-blur-sm border border-white/10 text-white/70 hover:text-[var(--primary)] hover:border-[var(--primary)] hover:scale-110 transition-all duration-300 rounded-full group"
//         >
//           <ChevronLeft className="w-8 h-8 md:w-10 md:h-10 stroke-[1.5] group-hover:stroke-2" />
//         </button>
//       </div>
//       <div className="absolute top-1/2 -translate-y-1/2 right-4 md:right-8 z-40">
//         <button 
//           onClick={() => paginate(1)}
//           className="p-3 bg-black/20 backdrop-blur-sm border border-white/10 text-white/70 hover:text-[var(--primary)] hover:border-[var(--primary)] hover:scale-110 transition-all duration-300 rounded-full group"
//         >
//           <ChevronRight className="w-8 h-8 md:w-10 md:h-10 stroke-[1.5] group-hover:stroke-2" />
//         </button>
//       </div>

//       {/* Bottom Controls - NOW RIGHT ALIGNED */}
//       <div className="absolute bottom-8 left-6 md:left-12 right-6 md:right-12 flex justify-end items-end z-40">
//         <div className="flex items-baseline gap-2 font-mono">
//           <motion.span 
//             key={currentIndex}
//             initial={{ opacity: 0, y: 10 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="text-5xl font-black text-white"
//           >
//             {currentIndex + 1}
//           </motion.span>
//           <span className="text-2xl font-bold text-gray-600">/ {slides.length}</span>
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Gamepad2, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import Navbar from '@/components/customer/layout/NavBar';
// import { Navbar } from '@/components/customer/layout/NavBar';

// --- Types & Data ---

interface SlideData {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  price: string;
}

const slides: SlideData[] = [
  {
    id: 1,
    image: "https://demo.bravisthemes.com/playhost/wp-content/uploads/2023/12/Slide3.webp",
    title: "GALACTIC ODYSSEY",
    subtitle: "Aute esse non magna elit dolore dolor sit est. Ea occaecat ea duis laborum reprehenderit id cillum tempor cupidatat qui nisi proident nostrud dolore.",
    price: "9.99"
  },
  {
    id: 2,
    image: "https://demo.bravisthemes.com/playhost/wp-content/uploads/2023/12/Slide2.webp",
    title: "COSMIC WARFARE",
    subtitle: "Experience high-performance servers with ultra-low latency. Dominate the galaxy with uninterrupted gameplay and dedicated resources.",
    price: "14.99"
  },
  {
    id: 3,
    image: "https://demo.bravisthemes.com/playhost/wp-content/uploads/2023/12/Slide4.webp",
    title: "NEBULA SURVIVAL",
    subtitle: "Build, explore, and survive in infinite procedurally generated universes. Our servers ensure your progress is always safe and fast.",
    price: "12.50"
  },
  {
    id: 4,
    image: "https://demo.bravisthemes.com/playhost/wp-content/uploads/2023/12/Slide1.webp",
    title: "STARFLEET COMMAND",
    subtitle: "Lead your fleet to victory. Deploy custom mods effortlessly with our one-click installer and 24/7 priority customer support.",
    price: "19.99"
  }
];

const navLinks = [
  { num: "1", label: "Home" },
  { num: "2", label: "Game Servers" },
  { num: "3", label: "Locations" },
  { num: "4", label: "Support" },
  { num: "5", label: "News" },
  { num: "6", label: "Company" },
  { num: "7", label: "More Pages" }
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

// --- Components ---

// const Navbar = () => (
//   <nav className="absolute top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-6 md:px-12 bg-gradient-to-b from-black/90 to-transparent">
//     <div className="flex items-center gap-2 cursor-pointer">
//       <Gamepad2 className="w-8 h-8 text-[var(--primary)]" />
//       <span className="text-2xl font-bold text-white tracking-wide">playhost</span>
//     </div>

//     <div className="hidden lg:flex items-center gap-8">
//       {navLinks.map((link) => (
//         <div key={link.label} className="flex flex-col items-center group cursor-pointer">
//           <span className="text-[10px] text-gray-500 font-mono mb-1 group-hover:text-[var(--primary)] transition-colors duration-300">
//             {link.num}
//           </span>
//           <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors duration-300 flex items-center gap-1">
//             {link.label}
//             <ChevronRight className="w-3 h-3 rotate-90 text-gray-500 group-hover:text-[var(--primary)] transition-colors" />
//           </span>
//         </div>
//       ))}
//     </div>

//     <div className="flex items-center gap-4">
//       <button className="hidden md:block px-6 py-2.5 border-gradient-animated text-[var(--primary)] font-bold text-xs tracking-widest uppercase hover:bg-[var(--primary)] hover:text-black transition-all duration-300">
//         Get Hosting
//       </button>
//       <button className="lg:hidden text-white hover:text-[var(--primary)] transition-colors">
//         <Menu className="w-7 h-7" />
//       </button>
//     </div>
//   </nav>
// );

export default function HeroCarousel() {
  // Track both the absolute page number and the direction we are moving
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
    }, 7000);
    
    return () => clearInterval(timer);
  }, [page]); // Reset timer if page changes manually

  return (
    <div className="relative w-full h-screen bg-[#0a0a0a] overflow-hidden selection:bg-[var(--primary)] selection:text-black font-Oxanium">
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
          {/* Zooming Background Image */}
          <motion.div
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${slides[currentIndex].image})` }}
            initial={{ scale: 1 }}
            animate={{ scale: 1.15 }}
            transition={{ duration: 10, ease: "linear" }}
          />
          
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Slide Text Content */}
          <div className="absolute inset-0 flex items-center px-6 md:px-40 ">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="max-w-3xl pt-20 "
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8">
                <span className="w-3 h-3 rounded-full bg-[var(--primary)] glow-primary animate-pulse" />
                <span className="text-sm font-medium text-white tracking-wide">Servers Are Available</span>
              </motion.div>

              <motion.h1 
                variants={fadeUp}
                className="font-Oxanium text-6xl md:text-6xl tracking-wide bg-gradient-to-b from-white via-[#f0f0f0] to-[#a0a0a0] text-transparent bg-clip-text mb-4"
                style={{ textShadow: "0 10px 30px rgba(0,0,0,0.5)" }}
              >
                {slides[currentIndex].title}
              </motion.h1>

              <motion.p 
                variants={fadeUp}
                className="font-Oxanium  text-gray-300 text-base md:text-lg leading-relaxed mb-10 max-w-2xl font-light "
              >
                {slides[currentIndex].subtitle}
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col gap-5 font-Oxanium">
                <p className="text-gray-400 font-medium tracking-wide">Starting at</p>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-primary font-bold text-3xl mb-1">$</span>
                  <span className="text-5xl font-black text-white leading-none">{slides[currentIndex].price}</span>
                  <span className="text-primary font-medium text-xl mb-1">/monthly</span>
                </div>
                
                <button className="w-fit mt-1 bg-gradient-primary hover-gradient-shift glow-primary-hover text-black font-extrabold px-10 py-2 rounded-sm uppercase tracking-widest text-sm transition-all duration-300">
                  Order Your Game Server Now
                </button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows (Adjusted spacing here to left-2 md:left-4) */}
      <div className="absolute top-1/2 -translate-y-1/2 left-2 md:left-4 z-40">
        <button 
          onClick={() => paginate(-1)}
          className="p-3 text-primary  hover:scale-110 transition-all duration-300 rounded-full group"
        >
          <ChevronLeft className="w-12 h-12 md:w-18 md:h-18 stroke-[1.5] group-hover:stroke-2" />
        </button>
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 right-2 md:right-4 z-40">
        <button 
          onClick={() => paginate(1)}
          className="p-3 text-primary  hover:scale-110 transition-all duration-300 rounded-full group"
        >
          <ChevronRight className="w-12 h-12 md:w-18 md:h-18 stroke-[1.5] group-hover:stroke-2" />
        </button>
      </div>

      {/* Bottom Controls - NOW RIGHT ALIGNED */}
      <div className="absolute bottom-8 left-6 md:left-12 right-6 md:right-12 flex justify-end items-end z-40">
        <div className="flex items-baseline gap-2 font-mono">
          <motion.span 
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-black text-white"
          >
            {currentIndex + 1}
          </motion.span>
          <span className="text-2xl font-bold text-gray-600">/ {slides.length}</span>
        </div>
      </div>
    </div>
  );
}