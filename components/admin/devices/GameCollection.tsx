// import React, { useState, useRef } from 'react';
// import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

// // Extracted exactly from the original HTML
// const games = [
//   { id: 1, title: 'Shadow of Night', categories: ['popular'], img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2024/06/home10-img4-301x401.webp', price: '$14.99', discount: '20% OFF' },
//   { id: 2, title: 'Alien Football', categories: ['survival'], img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2024/06/home10-img3-301x401.webp', price: '$14.99', discount: '20% OFF' },
//   { id: 3, title: 'Ancient Realms', categories: ['survival'], img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2024/06/home10-img2-301x401.webp', price: '$14.99', discount: '20% OFF' },
//   { id: 4, title: 'Thunder and City', categories: ['fps', 'survival'], img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2023/12/1-1-301x401.webp', price: '$14.99', discount: '20% OFF' },
//   { id: 5, title: 'Mystic Racing Z', categories: ['sandbox'], img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2023/12/2-1-301x401.webp', price: '$14.99', discount: '20% OFF' },
//   { id: 6, title: 'Silent Wrath', categories: ['survival'], img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2023/12/3-1-301x401.webp', price: '$14.99', discount: '20% OFF' },
//   { id: 7, title: 'Funk Dungeon', categories: ['popular'], img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2023/12/4-1-301x401.webp', price: '$14.99', discount: '20% OFF' },
//   { id: 8, title: 'Galactic Odyssey', categories: ['popular'], img: 'https://demo.bravisthemes.com/playhost/wp-content/uploads/2023/12/5-1-301x401.webp', price: '$14.99', discount: '20% OFF' },
// ];

// const filters = [
//   { label: 'All Games', value: '*' },
//   { label: 'FPS', value: 'fps' },
//   { label: 'Popular', value: 'popular' },
//   { label: 'Sandbox', value: 'sandbox' },
//   { label: 'Survival', value: 'survival' },
// ];

// export default function GameCollection() {
//   const [activeFilter, setActiveFilter] = useState('*');
//   const sectionRef = useRef(null);

//   // Exact Stellar.js replication: Animating backgroundPositionY based on scroll
//   const { scrollYProgress } = useScroll({
//     target: sectionRef,
//     offset: ["start end", "end start"]
//   });
  
//   // Maps the scroll progress to a percentage to mimic data-stellar-background-ratio="0.5"
//   const backgroundPositionY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

//   // Isotope.js filter simulation
//   const filteredGames = games.filter(game => 
//     activeFilter === '*' ? true : game.categories.includes(activeFilter)
//   );

//   return (
//     <section ref={sectionRef} className="bg-[#1E1F22] py-24 relative overflow-hidden">
      
//       {/* True Parallax Background 
//         We use motion.div to animate the background position, matching Stellar.js exactly
//       */}
//       <motion.div 
//         className="absolute inset-0 opacity-20 pointer-events-none" 
//         style={{ 
//           backgroundImage: "url('https://demo.bravisthemes.com/playhost/wp-content/uploads/2023/12/3.webp')",
//           backgroundSize: "cover",
//           backgroundRepeat: "no-repeat",
//           backgroundPositionY // Direct animation of the CSS property
//         }}
//       />
      
//       {/* Top and Bottom gradient overlays from original CSS */}
//       <div className="absolute inset-0 bg-gradient-to-b from-[#1E1F22] via-transparent to-[#1E1F22] pointer-events-none" />

//       <div className="max-w-[1300px] mx-auto px-4 relative z-10">
        
//         {/* Header and Filter Block */}
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          
//           <div className="wp-title">
//             <motion.div 
//               initial={{ opacity: 0, y: 20 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               viewport={{ once: true, amount: 0.1 }} // amount: 0.1 mimics WOW.js offset
//               transition={{ duration: 1.2 }}
//               className="text-[#ADB7BE] text-sm md:text-base font-medium tracking-wide mb-2 block uppercase"
//             >
//               <span>Most complete</span>
//             </motion.div>
            
//             <motion.h2 
//               initial={{ opacity: 0, y: 50, skewY: 5 }}
//               whileInView={{ opacity: 1, y: 0, skewY: 0 }}
//               viewport={{ once: true, amount: 0.1 }} // amount: 0.1 mimics WOW.js offset
//               transition={{ duration: 1.2, ease: "easeOut" }}
//               className="text-4xl md:text-5xl font-extrabold font-oxanium bg-clip-text text-transparent bg-gradient-to-r from-[#5623d8] to-[#6a79fa]"
//             >
//               Game Collection
//             </motion.h2>
//           </div>

//           <motion.div 
//             initial={{ opacity: 0, x: 30 }}
//             whileInView={{ opacity: 1, x: 0 }}
//             viewport={{ once: true, amount: 0.1 }}
//             transition={{ duration: 1.2 }}
//             className="flex flex-wrap gap-4 md:gap-6"
//           >
//             {filters.map((filter) => (
//               <button
//                 key={filter.value}
//                 onClick={() => setActiveFilter(filter.value)}
//                 className={`text-base font-oxanium font-bold transition-all duration-300 relative ${
//                   activeFilter === filter.value 
//                     ? 'text-white' 
//                     : 'text-[#ADB7BE] hover:text-white'
//                 }`}
//               >
//                 {filter.label}
//                 {activeFilter === filter.value && (
//                   <motion.div 
//                     layoutId="isotope-active-filter"
//                     className="absolute -bottom-2 left-0 right-0 h-[2px] bg-gradient-to-r from-[#5623d8] to-[#6a79fa]"
//                   />
//                 )}
//               </button>
//             ))}
//           </motion.div>
//         </div>

//         {/* Isotope Grid Simulation */}
//         <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[30px]">
//           <AnimatePresence mode="popLayout">
//             {filteredGames.map((game) => (
//               <motion.div
//                 key={game.id}
//                 layout // Smoothly animates position changes when filtering
//                 initial={{ opacity: 0, x: 100 }} 
//                 whileInView={{ opacity: 1, x: 0 }}
//                 viewport={{ once: true, amount: 0.1 }} // amount: 0.1 mimics WOW.js offset delay
//                 exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
//                 transition={{ 
//                   opacity: { duration: 1.2, ease: "easeOut" },
//                   x: { duration: 1.2, ease: "easeOut" },
//                   layout: { duration: 0.4, ease: "easeInOut" } 
//                 }}
//                 className="col-span-1"
//               >
//                 <div className="pxl-item--inner group">
                  
//                   <div className="pxl-item--featured relative mb-6 overflow-hidden rounded-[10px]">
//                     <a href="#">
//                       <img 
//                         src={game.img} 
//                         alt={game.title} 
//                         className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
//                         loading="lazy"
//                       />
//                     </a>
//                     {game.discount && (
//                       <span className="pxl-discount absolute top-4 left-4 bg-[#6a79fa] text-white text-[11px] font-bold px-3 py-1 rounded-[4px] tracking-wider">
//                         {game.discount}
//                       </span>
//                     )}
//                   </div>

//                   <div className="pxl-item--holder text-left">
//                     <h4 className="pxl-item--title text-[22px] font-bold font-oxanium text-white mb-2 transition-colors duration-300 group-hover:text-[#6a79fa]">
//                       <a href="#">{game.title}</a>
//                     </h4>
                    
//                     <span className="pxl-item--price block text-[#ADB7BE] text-[15px] font-medium mb-5">
//                       Starting at <span className="price text-white font-bold text-[18px]">{game.price}</span>
//                     </span>
                    
//                     <div className="pxl-post--readmore btn">
//                       <a 
//                         href="#" 
//                         className="inline-block border border-white/10 text-white font-oxanium font-bold text-sm px-7 py-[10px] rounded-[5px] transition-all duration-300 hover:bg-gradient-to-r hover:from-[#5623d8] hover:to-[#6a79fa] hover:border-transparent"
//                       >
//                         <span>Order Now</span>
//                       </a>
//                     </div>
//                   </div>

//                 </div>
//               </motion.div>
//             ))}
//           </AnimatePresence>
//         </motion.div>
        
//       </div>
//     </section>
//   );
// }

import React, { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence, Variants } from 'framer-motion';

interface Game {
  id: number;
  title: string;
  price: string;
  discount: string;
  image: string;
  categories: string[];
}

const games: Game[] = [
  { id: 1, title: "Shadow of Night",   price: "$14.99", discount: "20% OFF", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop", categories: ["popular"] },
  { id: 2, title: "Alien Football",    price: "$14.99", discount: "20% OFF", image: "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?q=80&w=600&auto=format&fit=crop", categories: ["survival"] },
  { id: 3, title: "Ancient Realms",    price: "$14.99", discount: "20% OFF", image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop", categories: ["survival"] },
  { id: 4, title: "Thunder and City",  price: "$14.99", discount: "20% OFF", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=600&auto=format&fit=crop", categories: ["fps", "survival"] },
  { id: 5, title: "Mystic Racing Z",   price: "$14.99", discount: "20% OFF", image: "https://images.unsplash.com/photo-1580234811497-9df7fd2f357e?q=80&w=600&auto=format&fit=crop", categories: ["sandbox"] },
  { id: 6, title: "Silent Wrath",      price: "$14.99", discount: "20% OFF", image: "https://images.unsplash.com/photo-1640955014216-75201056c829?q=80&w=600&auto=format&fit=crop", categories: ["survival"] },
  { id: 7, title: "Funk Dungeon",      price: "$14.99", discount: "20% OFF", image: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?q=80&w=600&auto=format&fit=crop", categories: ["popular"] },
  { id: 8, title: "Galactic Odyssey",  price: "$14.99", discount: "20% OFF", image: "https://images.unsplash.com/photo-1464802686167-b939a6910659?q=80&w=600&auto=format&fit=crop", categories: ["popular"] },
];

const filters = [
  { label: "All Games", value: "all" },
  { label: "FPS",       value: "fps" },
  { label: "Popular",   value: "popular" },
  { label: "Sandbox",   value: "sandbox" },
  { label: "Survival",  value: "survival" },
];

// --- Heading animations ---
const fadeUpVariants: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const skewInVariants: Variants = {
  hidden:  { opacity: 0, skewY: 6, y: 30 },
  visible: { opacity: 1, skewY: 0, y: 0, transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] } },
};

// --- Card ---
function GameCard({
  game,
  index,
  isFiltering,
}: {
  game: Game;
  index: number;
  isFiltering: boolean;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      layout
      // ── On first scroll-in: fadeInRight (x: 60 → 0) ──────────────────
      // ── On filter enter:    scale 0 → 1  (small → big "open") ─────────
      initial={isFiltering ? { opacity: 0, scale: 0, x: 0 } : { opacity: 0, x: 60, scale: 1 }}
      animate={
        isFiltering
          ? {
              opacity: 1,
              scale: 1,
              x: 0,
              transition: {
                duration: 0.4,
                ease: [0, 0.55, 0.45, 1], // spring-like fast-out
                delay: index * 0.055,
              },
            }
          : inView
          ? {
              opacity: 1,
              x: 0,
              scale: 1,
              transition: {
                duration: 1.2,
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: index * 0.08,
              },
            }
          : { opacity: 0, x: 60, scale: 1 }
      }
      // ── On filter exit: scale 1 → 0  (big → small "close") ───────────
      exit={{
        opacity: 0,
        scale: 0,
        transition: {
          duration: 0.3,
          ease: [0.55, 0, 1, 0.45], // fast-in snappy close
          delay: index * 0.03,      // slight stagger on close too
        },
      }}
      className="group relative rounded-xl overflow-hidden cursor-pointer"
      style={{ aspectRatio: '301/401' }}
    >
      {/* Image */}
      <img
        src={game.image}
        alt={game.title}
        className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(.25,.46,.45,.94)] group-hover:scale-110"
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-500" />

      {/* Discount badge */}
      <div className="absolute top-3 right-3 z-20">
        <span
          className="px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white rounded"
          style={{ background: 'linear-gradient(90deg, #5623d8 0%, #6a79fa 100%)' }}
        >
          {game.discount}
        </span>
      </div>

      {/* Bottom content */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 p-4 group-hover:-translate-y-1 transition-transform duration-400"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)' }}
      >
        <h4
          className="text-white font-bold text-base leading-tight mb-1.5 transition-colors duration-300 group-hover:text-[#6a79fa]"
          style={{ fontFamily: "'Oxanium', sans-serif" }}
        >
          {game.title}
        </h4>

        <span className="text-[#ADB7BE] text-[12px] font-medium">
          Starting at{' '}
          <span className="text-white font-bold text-[15px]" style={{ fontFamily: "'Oxanium', sans-serif" }}>
            {game.price}
          </span>
        </span>

        {/* Order Now — slides up on hover */}
        <div className="mt-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400 ease-[cubic-bezier(.25,.46,.45,.94)]">
          <button
            className="w-full py-2.5 rounded-lg text-[12px] font-bold uppercase tracking-widest text-white transition-all duration-300 hover:brightness-110 active:scale-95"
            style={{ background: 'linear-gradient(90deg, #5623d8 0%, #6a79fa 100%)', fontFamily: "'Oxanium', sans-serif" }}
          >
            Order Now
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// --- Main ---
export default function GameCollection() {
  const [activeFilter, setActiveFilter] = useState('all');
  // Track whether we're in a "filter change" vs "initial scroll-in"
  const [isFiltering, setIsFiltering] = useState(false);

  const headingRef = useRef(null);
  const headingInView = useInView(headingRef, { once: true, margin: "-50px" });

  const handleFilter = (value: string) => {
    setIsFiltering(true);
    setActiveFilter(value);
  };

  const filtered = activeFilter === 'all'
    ? games
    : games.filter(g => g.categories.includes(activeFilter));

  return (
    <section
      className="relative py-24 overflow-hidden"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?q=80&w=2000&auto=format&fit=crop')",
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
      }}
    >
      <div
        className="absolute inset-0 z-0"
        style={{ background: 'linear-gradient(to bottom, #1E1F22 0%, rgba(30,31,34,0.88) 50%, #1E1F22 100%)' }}
      />

      <div className="max-w-[1300px] mx-auto px-4 relative z-10">

        {/* Header */}
        <div
          ref={headingRef}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10"
        >
          <div>
            <motion.div variants={fadeUpVariants} initial="hidden" animate={headingInView ? "visible" : "hidden"} className="mb-2">
              <span className="text-[13px] font-semibold uppercase tracking-[0.18em]" style={{ color: '#ADB7BE' }}>
                Most complete
              </span>
            </motion.div>
            <motion.h2
              variants={skewInVariants}
              initial="hidden"
              animate={headingInView ? "visible" : "hidden"}
              className="text-3xl md:text-4xl font-extrabold uppercase leading-tight"
              style={{
                fontFamily: "'Oxanium', sans-serif",
                background: 'linear-gradient(135deg, #5623d8 0%, #6a79fa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Game Collection
            </motion.h2>
          </div>

          {/* Filter buttons */}
          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            animate={headingInView ? "visible" : "hidden"}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2"
          >
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => handleFilter(f.value)}
                className="px-4 py-1.5 rounded text-[12px] font-semibold uppercase tracking-wider transition-all duration-300"
                style={
                  activeFilter === f.value
                    ? { background: 'linear-gradient(90deg, #5623d8 0%, #6a79fa 100%)', color: '#fff', fontFamily: "'Oxanium', sans-serif" }
                    : { background: 'rgba(255,255,255,0.06)', color: '#ADB7BE', border: '1px solid rgba(255,255,255,0.08)', fontFamily: "'Oxanium', sans-serif" }
                }
              >
                {f.label}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Grid
            AnimatePresence mode="popLayout":
              - exiting cards animate scale 1→0 (big→small "close")
              - entering cards animate scale 0→1 (small→big "open")
              - layout prop smoothly reflows the grid gap */}
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[14px]">
          <AnimatePresence mode="popLayout">
            {filtered.map((game, i) => (
              <GameCard
                key={game.id}
                game={game}
                index={i}
                isFiltering={isFiltering}
              />
            ))}
          </AnimatePresence>
        </motion.div>

      </div>
    </section>
  );
}