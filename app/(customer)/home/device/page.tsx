// import React from 'react';
// import { motion} from 'framer-motion';

// // --- Types ---
// interface Station {
//   id: number;
//   name: string;
//   station_num: string;
//   regular_hourly_rate: number;
//   included_players: number;
//   max_players: number;
//   extra_player_charge: number;
//   isAvailable: boolean;
//   availability: string;
//   description: string;
//   image: string;
//   delay: number;
// }

// // --- Mock Data ---
// const stations: Station[] = [
//   {
//     id: 1,
//     name: "Snooker Table",
//     station_num: "ST-01",
//     regular_hourly_rate: 500,
//     included_players: 2,
//     max_players: 4,
//     extra_player_charge: 80,
//     isAvailable: true,
//     availability: "3 Available",
//     description: "Full-size 12ft professional snooker table with premium cloth and automated scoring.",
//     image: "https://images.unsplash.com/photo-1615213612138-4d1195b1c0e9?q=80&w=800&auto=format&fit=crop",
//     delay: 0.2,
//   },
//   {
//     id: 2,
//     name: "American Pool",
//     station_num: "ST-02",
//     regular_hourly_rate: 350,
//     included_players: 2,
//     max_players: 4,
//     extra_player_charge: 60,
//     isAvailable: true,
//     availability: "5 Available",
//     description: "9-ball regulation American pool table with bar-spec accessories included.",
//     image: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=800&auto=format&fit=crop",
//     delay: 0.4,
//   },
//   {
//     id: 3,
//     name: "Aerial Pool Arena",
//     station_num: "ST-03",
//     regular_hourly_rate: 650,
//     included_players: 4,
//     max_players: 8,
//     extra_player_charge: 100,
//     isAvailable: false,
//     availability: "Fully Booked",
//     description: "Multi-table aerial pool arena with overhead cameras and live score projection.",
//     image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?q=80&w=800&auto=format&fit=crop",
//     delay: 0.6,
//   },
//   {
//     id: 4,
//     name: "Mini Snooker",
//     station_num: "ST-04",
//     regular_hourly_rate: 280,
//     included_players: 2,
//     max_players: 2,
//     extra_player_charge: 0,
//     isAvailable: true,
//     availability: "8 Available",
//     description: "Compact 6ft snooker table — perfect for quick sessions and beginners.",
//     image: "https://images.unsplash.com/photo-1611996575749-79a3a250f948?q=80&w=800&auto=format&fit=crop",
//     delay: 0.8,
//   },
// ];

// // --- Station Card ---
// // Card layout + hover effect unchanged. Motion props passed in from parent (feature-style).
// function StationCard({ station, motionProps }: { station: Station; motionProps: object }) {
//   const avail = station.isAvailable;

//   return (
//     <motion.div
//       {...motionProps}
//       className="group relative rounded-md overflow-hidden cursor-pointer"
//       style={{ aspectRatio: '3/4' }}
//     >
//       {/* Background Image */}
//       <img
//         src={station.image}
//         alt={station.name}
//         className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(.25,1,.5,1)] group-hover:scale-105"
//       />

//       {/* Gradient Overlay */}
//       <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/50 to-black/10 transition-all duration-400 group-hover:from-black/98 group-hover:via-black/60" />

//       {/* Station Number — top left */}
//       <div className="absolute top-3.5 left-4 z-10 font-semibold text-[11px] tracking-widest text-white/30 uppercase">
//         {station.station_num}
//       </div>

//       {/* Availability Badge — top right */}
//       <div
//         className={`absolute top-3.5 right-4 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-bold tracking-widest uppercase transition-transform duration-400 group-hover:-translate-y-1 ${
//           avail
//             ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
//             : 'bg-red-500/10 text-red-400 border border-red-500/20'
//         }`}
//       >
//         <span className={`w-1.5 h-1.5 rounded-full ${avail ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
//         {station.availability}
//       </div>

//       {/* Bottom Info — slides up on hover to reveal button */}
//       <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-4 pt-6 transition-transform duration-400 ease-[cubic-bezier(.25,1,.5,1)] group-hover:-translate-y-14">
//         {/* Device Name */}
//         <h3
//           className={`font-black text-lg uppercase tracking-wide leading-tight mb-2 ${avail ? 'text-amber-400' : 'text-white/40'}`}
//           style={{ fontFamily: "'Rajdhani', sans-serif" }}
//         >
//           {station.name}
//         </h3>

//         {/* Price */}
//         <div className="flex items-baseline gap-1.5 mb-3">
//           <span className="text-white font-black text-2xl leading-none" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
//             ₹{station.regular_hourly_rate}
//           </span>
//           <span className="text-white/40 text-[10px] font-semibold uppercase tracking-widest">/ hr</span>
//         </div>

//         {/* Meta Pills */}
//         <div className="flex flex-wrap gap-1.5 mb-3">
//           <span className="bg-white/7 border border-white/10 rounded-full text-[12px] text-white/50 px-2.5 py-1 font-medium tracking-wide">
//             Incl. <span className="text-white/80 font-semibold">{station.included_players}</span> players
//           </span>
//           <span className="bg-white/7 border border-white/10 rounded-full text-[12px] text-white/50 px-2.5 py-1 font-medium tracking-wide">
//             Max <span className="text-white/80 font-semibold">{station.max_players}</span>
//           </span>
//           {station.extra_player_charge > 0 ? (
//             <span className="bg-white/7 border border-white/10 rounded-full text-[12px] text-white/50 px-2.5 py-1 font-medium tracking-wide">
//               +<span className="text-white/80 font-semibold">₹{station.extra_player_charge}</span>/extra
//             </span>
//           ) : (
//             <span className="bg-white/7 border border-white/10 rounded-full text-[12px] text-white/50 px-2.5 py-1 font-medium tracking-wide">
//               <span className="text-white/80 font-semibold">No</span> extra charge
//             </span>
//           )}
//         </div>

//         {/* Description */}
//         <p className="text-white/30 text-[13px] leading-relaxed line-clamp-2">
//           {station.description}
//         </p>
//       </div>

//       {/* Book Station Button — slides up from bottom on hover */}
//       <div className="absolute bottom-4 left-4 right-4 z-20 translate-y-5 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400 ease-[cubic-bezier(.25,1,.5,1)]">
//         <button
//           disabled={!avail}
//           className={`w-full py-3 rounded-xl font-black text-[13px] tracking-widest uppercase transition-colors duration-200 ${
//             avail
//               ? 'bg-amber-400 text-black hover:bg-amber-300 active:scale-95'
//               : 'bg-white/6 text-white/25 border border-white/10 cursor-not-allowed'
//           }`}
//           style={{ fontFamily: "'Rajdhani', sans-serif" }}
//         >
//           {avail ? 'Book Station' : 'Join Waitlist'}
//         </button>
//       </div>
//     </motion.div>
//   );
// }

// // --- Main Section ---
// export default function AmazingFeatures() {
//   return (
//     <section id="features" className="relative bg-[#0a0a0a] py-24 overflow-hidden">

//       {/* Ambient Glows */}
//       <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
//       <div className="absolute bottom-[-10%] right-[-5%] w-150 h-150 bg-amber-500/8 rounded-full blur-[150px] pointer-events-none" />

//       <div className="max-w-7xl mx-auto px-4 relative z-10">

//         {/* Section Heading — same motion as original features */}
//         <div className="text-center mb-16 flex flex-col items-center">
//           <motion.span
//             initial={{ opacity: 0, y: 30 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true }}
//             transition={{ duration: 0.6 }}
//             className="text-[#ADB7BE] text-sm md:text-base font-medium tracking-wide mb-3 block"
//           >
//             Why choose Playhost
//           </motion.span>

//           <motion.div
//             initial={{ opacity: 0, y: 30 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true }}
//             transition={{ duration: 0.6, delay: 0.1 }}
//             className="relative inline-block"
//           >
//             <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-24 h-24 bg-amber-500/15 blur-3xl rounded-full" />
//             <h2
//               className="relative text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-linear-to-b from-white via-gray-200 to-gray-500 tracking-wide uppercase"
//               style={{ fontFamily: "'Rajdhani', sans-serif" }}
//             >
//               Amazing Features
//             </h2>
//           </motion.div>
//         </div>

//         {/* Device Cards Grid — feature-style motion (slide from right + whileInView + delay) */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//           {stations.map((station) => (
//             <StationCard
//               key={station.id}
//               station={station}
//               motionProps={{
//                 initial: { opacity: 0, x: 50 },
//                 whileInView: { opacity: 1, x: 0 },
//                 viewport: { once: true, margin: '-50px' },
//                 transition: { duration: 0.5, delay: station.delay },
//               }}
//             />
//           ))}
//         </div>

//       </div>
//     </section>
//   );
// }

// import React from 'react';
// import { motion } from 'framer-motion';

// interface Station {
//   id: number;
//   name: string;
//   station_num: string;
//   regular_hourly_rate: number;
//   included_players: number;
//   max_players: number;
//   extra_player_charge: number;
//   isAvailable: boolean;
//   availability: string;
//   description: string;
//   image: string;
//   delay: number;
// }

// const stations: Station[] = [
//   {
//     id: 1,
//     name: "Snooker Table",
//     station_num: "ST-01",
//     regular_hourly_rate: 500,
//     included_players: 2,
//     max_players: 4,
//     extra_player_charge: 80,
//     isAvailable: true,
//     availability: "3 Available",
//     description: "Full-size 12ft professional snooker table with premium cloth and automated scoring.",
//     image: "https://images.unsplash.com/photo-1615213612138-4d1195b1c0e9?q=80&w=800&auto=format&fit=crop",
//     delay: 0.2,
//   },
//   {
//     id: 2,
//     name: "American Pool",
//     station_num: "ST-02",
//     regular_hourly_rate: 350,
//     included_players: 2,
//     max_players: 4,
//     extra_player_charge: 60,
//     isAvailable: true,
//     availability: "5 Available",
//     description: "9-ball regulation American pool table with bar-spec accessories included.",
//     image: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=800&auto=format&fit=crop",
//     delay: 0.4,
//   },
//   {
//     id: 3,
//     name: "Aerial Pool Arena",
//     station_num: "ST-03",
//     regular_hourly_rate: 650,
//     included_players: 4,
//     max_players: 8,
//     extra_player_charge: 100,
//     isAvailable: false,
//     availability: "Fully Booked",
//     description: "Multi-table aerial pool arena with overhead cameras and live score projection.",
//     image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?q=80&w=800&auto=format&fit=crop",
//     delay: 0.6,
//   },
//   {
//     id: 4,
//     name: "Mini Snooker",
//     station_num: "ST-04",
//     regular_hourly_rate: 280,
//     included_players: 2,
//     max_players: 2,
//     extra_player_charge: 0,
//     isAvailable: true,
//     availability: "8 Available",
//     description: "Compact 6ft snooker table — perfect for quick sessions and beginners.",
//     image: "https://images.unsplash.com/photo-1611996575749-79a3a250f948?q=80&w=800&auto=format&fit=crop",
//     delay: 0.8,
//   },
// ];

// function StationCard({ station, motionProps }: { station: Station; motionProps: object }) {
//   const avail = station.isAvailable;

//   return (
//     <motion.div
//       {...motionProps}
//       // Mobile: 4/3 (landscape-ish, compact) | 581px+: 3/4 (portrait)
//       className="group relative rounded-2xl overflow-hidden cursor-pointer aspect-[4/3] min-[581px]:aspect-[3/4]"
//     >
//       {/* Background Image */}
//       <img
//         src={station.image}
//         alt={station.name}
//         className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(.25,1,.5,1)] group-hover:scale-105"
//       />

//       {/* Gradient Overlay — stronger at bottom always */}
//       <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10 transition-all duration-400 group-hover:from-black/98 group-hover:via-black/55" />

//       {/* Station Number — top left */}
//       <div className="absolute top-3 left-3.5 z-10 font-semibold text-[10px] tracking-widest text-white/30 uppercase">
//         {station.station_num}
//       </div>

//       {/* Availability Badge — top right */}
//       <div className={`absolute top-3 right-3.5 z-10 flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] min-[581px]:text-[9px] font-bold tracking-widest uppercase transition-transform duration-400 group-hover:-translate-y-1 ${
//         avail
//           ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
//           : 'bg-red-500/10 text-red-400 border border-red-500/20'
//       }`}>
//         <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${avail ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
//         {station.availability}
//       </div>

//       {/* Bottom Info — slides up on hover to reveal button */}
//       <div className="absolute bottom-0 left-0 right-0 z-10 px-3.5 pb-3.5 pt-5 min-[581px]:px-4 min-[581px]:pb-4 min-[581px]:pt-6 transition-transform duration-400 ease-[cubic-bezier(.25,1,.5,1)] group-hover:-translate-y-14">

//         {/* Device Name */}
//         <h3
//           className={`font-black uppercase tracking-wide leading-tight mb-1.5 text-base min-[581px]:text-lg ${avail ? 'text-amber-400' : 'text-white/40'}`}
//           style={{ fontFamily: "'Rajdhani', sans-serif" }}
//         >
//           {station.name}
//         </h3>

//         {/* Price */}
//         <div className="flex items-baseline gap-1.5 mb-2 min-[581px]:mb-3">
//           <span className="text-white font-black text-xl min-[581px]:text-2xl leading-none" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
//             ₹{station.regular_hourly_rate}
//           </span>
//           <span className="text-white/40 text-[9px] font-semibold uppercase tracking-widest">/ hr</span>
//         </div>

//         {/* Meta Pills */}
//         <div className="flex flex-wrap gap-1 min-[581px]:gap-1.5 mb-2 min-[581px]:mb-3">
//           <span className="bg-white/7 border border-white/10 rounded-full text-[10px] min-[581px]:text-[12px] text-white/50 px-2 min-[581px]:px-2.5 py-0.5 min-[581px]:py-1 font-medium tracking-wide">
//             Incl. <span className="text-white/80 font-semibold">{station.included_players}</span> players
//           </span>
//           <span className="bg-white/7 border border-white/10 rounded-full text-[10px] min-[581px]:text-[12px] text-white/50 px-2 min-[581px]:px-2.5 py-0.5 min-[581px]:py-1 font-medium tracking-wide">
//             Max <span className="text-white/80 font-semibold">{station.max_players}</span>
//           </span>
//           {station.extra_player_charge > 0 ? (
//             <span className="bg-white/7 border border-white/10 rounded-full text-[10px] min-[581px]:text-[12px] text-white/50 px-2 min-[581px]:px-2.5 py-0.5 min-[581px]:py-1 font-medium tracking-wide">
//               +<span className="text-white/80 font-semibold">₹{station.extra_player_charge}</span>/extra
//             </span>
//           ) : (
//             <span className="bg-white/7 border border-white/10 rounded-full text-[10px] min-[581px]:text-[12px] text-white/50 px-2 min-[581px]:px-2.5 py-0.5 min-[581px]:py-1 font-medium tracking-wide">
//               <span className="text-white/80 font-semibold">No</span> extra charge
//             </span>
//           )}
//         </div>

//         {/* Description — hidden on mobile to keep card compact */}
//         <p className="hidden min-[581px]:block text-white/30 text-[13px] leading-relaxed line-clamp-2">
//           {station.description}
//         </p>
//       </div>

//       {/* Book Station Button — slides up from bottom on hover */}
//       <div className="absolute bottom-3.5 min-[581px]:bottom-4 left-3.5 min-[581px]:left-4 right-3.5 min-[581px]:right-4 z-20 translate-y-5 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400 ease-[cubic-bezier(.25,1,.5,1)]">
//         <button
//           disabled={!avail}
//           className={`w-full py-2.5 min-[581px]:py-3 rounded-xl font-black text-[12px] min-[581px]:text-[13px] tracking-widest uppercase transition-colors duration-200 ${
//             avail
//               ? 'bg-amber-400 text-black hover:bg-amber-300 active:scale-95'
//               : 'bg-white/6 text-white/25 border border-white/10 cursor-not-allowed'
//           }`}
//           style={{ fontFamily: "'Rajdhani', sans-serif" }}
//         >
//           {avail ? 'Book Station' : 'Join Waitlist'}
//         </button>
//       </div>
//     </motion.div>
//   );
// }

// export default function AmazingFeatures() {
//   return (
//     <section id="features" className="relative bg-[#0a0a0a] py-24 overflow-hidden">

//       <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
//       <div className="absolute bottom-[-10%] right-[-5%] w-150 h-150 bg-amber-500/8 rounded-full blur-[150px] pointer-events-none" />

//       <div className="max-w-7xl mx-auto px-4 relative z-10">

//         <div className="text-center mb-16 flex flex-col items-center">
//           <motion.span
//             initial={{ opacity: 0, y: 30 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true }}
//             transition={{ duration: 0.6 }}
//             className="text-[#ADB7BE] text-sm md:text-base font-medium tracking-wide mb-3 block"
//           >
//             Why choose Playhost
//           </motion.span>

//           <motion.div
//             initial={{ opacity: 0, y: 30 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true }}
//             transition={{ duration: 0.6, delay: 0.1 }}
//             className="relative inline-block"
//           >
//             <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-24 h-24 bg-amber-500/15 blur-3xl rounded-full" />
//             <h2
//               className="relative text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-linear-to-b from-white via-gray-200 to-gray-500 tracking-wide uppercase"
//               style={{ fontFamily: "'Rajdhani', sans-serif" }}
//             >
//               Amazing Features
//             </h2>
//           </motion.div>
//         </div>

//         {/*
//           Grid breakpoints:
//           < 581px   → 1 col, aspect-[4/3] (compact landscape card)
//           581–787px → 2 cols, aspect-[3/4] (portrait)
//           787–931px → 3 cols, aspect-[3/4]
//           931px+    → 4 cols, aspect-[3/4]
//         */}
//         <div className="grid gap-4
//           grid-cols-1
//           min-[581px]:grid-cols-2
//           min-[787px]:grid-cols-3
//           min-[932px]:grid-cols-4
//         ">
//           {stations.map((station) => (
//             <StationCard
//               key={station.id}
//               station={station}
//               motionProps={{
//                 initial: { opacity: 0, x: 50 },
//                 whileInView: { opacity: 1, x: 0 },
//                 viewport: { once: true, margin: '-50px' },
//                 transition: { duration: 0.5, delay: station.delay },
//               }}
//             />
//           ))}
//         </div>

//       </div>
//     </section>
//   );
// }

// above code is coorect



// import React from 'react'
// import { motion } from 'framer-motion'
// import { StationCard } from '@/components/customer/home/device/StationCard'

// export interface Station {
//   id: number
//   name: string
//   station_num: string
//   regular_hourly_rate: number
//   included_players: number
//   max_players: number
//   extra_player_charge: number
//   isAvailable: boolean
//   availability: string
//   description: string
//   image: string
//   delay: number
// }

// const stations: Station[] = [
//   {
//     id: 1,
//     name: 'Snooker Table',
//     station_num: 'ST-01',
//     regular_hourly_rate: 500,
//     included_players: 2,
//     max_players: 4,
//     extra_player_charge: 80,
//     isAvailable: true,
//     availability: '3 Available',
//     description:
//       'Full-size 12ft professional snooker table with premium cloth and automated scoring.',
//     image:
//       'https://images.unsplash.com/photo-1615213612138-4d1195b1c0e9?q=80&w=800&auto=format&fit=crop',
//     delay: 0.2,
//   },
//   {
//     id: 2,
//     name: 'American Pool',
//     station_num: 'ST-02',
//     regular_hourly_rate: 350,
//     included_players: 2,
//     max_players: 4,
//     extra_player_charge: 60,
//     isAvailable: true,
//     availability: '5 Available',
//     description: '9-ball regulation American pool table with bar-spec accessories included.',
//     image:
//       'https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=800&auto=format&fit=crop',
//     delay: 0.4,
//   },
//   {
//     id: 3,
//     name: 'Aerial Pool Arena',
//     station_num: 'ST-03',
//     regular_hourly_rate: 650,
//     included_players: 4,
//     max_players: 8,
//     extra_player_charge: 100,
//     isAvailable: false,
//     availability: 'Fully Booked',
//     description: 'Multi-table aerial pool arena with overhead cameras and live score projection.',
//     image:
//       'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?q=80&w=800&auto=format&fit=crop',
//     delay: 0.6,
//   },
//   {
//     id: 4,
//     name: 'Mini Snooker',
//     station_num: 'ST-04',
//     regular_hourly_rate: 280,
//     included_players: 2,
//     max_players: 2,
//     extra_player_charge: 0,
//     isAvailable: true,
//     availability: '8 Available',
//     description: 'Compact 6ft snooker table — perfect for quick sessions and beginners.',
//     image:
//       'https://images.unsplash.com/photo-1611996575749-79a3a250f948?q=80&w=800&auto=format&fit=crop',
//     delay: 0.8,
//   },
// ]


// export default function DevicePage() {
//   return (
//     <section id="features" className="relative bg-[#0a0a0a] py-24 overflow-hidden">
//       <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
//       <div className="absolute bottom-[-10%] right-[-5%] w-150 h-150 bg-amber-500/8 rounded-full blur-[150px] pointer-events-none" />

//       <div className="max-w-7xl mx-auto px-4 relative z-10">
//         <div className="text-left mb-16 flex flex-col items-start">
//           <motion.div
//             initial={{ opacity: 0, y: 30 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true }}
//             transition={{ duration: 0.6 }}
//             className="relative inline-block"
//           >
//             {/* Amber glow anchored to the left */}
//             <div className="absolute -top-8 left-0 w-24 h-24 bg-amber-500/15 blur-3xl rounded-full" />
//             <h2
//               className="relative text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-linear-to-b from-white via-gray-200 to-gray-500 tracking-wide uppercase"
//               style={{ fontFamily: "'Rajdhani', sans-serif" }}
//             >
//               Select Your Device
//             </h2>
//           </motion.div>
//         </div>

//         <div
//           className="grid gap-4
//           grid-cols-1
//           min-[581px]:grid-cols-2
//           min-[787px]:grid-cols-3
//           min-[932px]:grid-cols-4
//         "
//         >
//           {stations.map(station => (
//             <StationCard
//               key={station.id}
//               station={station}
//               motionProps={{
//                 initial: { opacity: 0, x: 50 },
//                 whileInView: { opacity: 1, x: 0 },
//                 viewport: { once: true, margin: '-50px' },
//                 transition: { duration: 0.5, delay: station.delay },
//               }}
//             />
//           ))}
//         </div>
//       </div>
//     </section>
//   )
// }


"use client";

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from "lucide-react"
import { StationCard } from '@/components/customer/home/device/StationCard'
import { getDevices } from './action';


export interface Station {
  id: number
  name: string
  station_num: string
  regular_hourly_rate: number
  included_players: number
  max_players: number
  extra_player_charge: number
  isAvailable: boolean
  availability: string
  description: string
  image: string
}

export default function DevicePage() {
  const [devicesArray, setDevicesArray] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // --- CLIENT-SIDE DATA FETCH ---
  const fetchFreshDevices = async () => {
    setIsLoadingData(true);
    try {
      const data = await getDevices();
      setDevicesArray(data || []);
    } catch (err) {
      console.error("Failed loading devices:", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchFreshDevices();
  }, []);

  return (
    <section id="features" className="relative bg-[#0a0a0a] min-h-screen py-24 overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-150 h-150 bg-amber-500/8 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        
        {/* Header Section */}
        <div className="text-left mb-16 flex flex-col items-start animate-in fade-in duration-700">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative inline-block"
          >
            <div className="absolute -top-8 left-0 w-24 h-24 bg-amber-500/15 blur-3xl rounded-full" />
            <h2
              className="relative text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-500 tracking-wide uppercase"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
            >
              Select Your Device
            </h2>
          </motion.div>
        </div>

        {/* Data View Layer */}
        <div className="mt-2 animate-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
          {isLoadingData ? (
            // Loading State (Matches Admin Style)
            <div className="text-center py-24 bg-[#121212]/50 border border-[#27272a]/50 rounded-2xl text-[#a1a1aa] flex flex-col justify-center items-center gap-3 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              <p className="font-medium tracking-wider uppercase text-sm">Initializing Stations...</p>
            </div>
          ) : devicesArray.length === 0 ? (
            // Empty State
            <div className="text-center py-24 bg-[#121212]/50 border border-[#27272a]/50 rounded-2xl text-[#a1a1aa] backdrop-blur-sm">
              No stations are currently available.
            </div>
          ) : (
            // Device Grid
            <div className="grid gap-4 grid-cols-1 min-[581px]:grid-cols-2 min-[787px]:grid-cols-3 min-[932px]:grid-cols-4">
              {devicesArray.map((device, index) => {
                
                // ✅ FIX: Extract properties from the nested device_type object and map the status string
                const stationData: Station = {
                  id: device.id,
                  name: device.device_type?.display_name || 'Unknown Station', 
                  station_num: device.station_number, 
                  regular_hourly_rate: device.device_type?.regular_hourly_rate || 0,
                  included_players: device.device_type?.included_players || 1, 
                  max_players: device.device_type?.max_players || 1, 
                  extra_player_charge: device.device_type?.extra_player_charge || 0, 
                  isAvailable: device.status === 'available',
                  availability: device.status === 'available' ? 'Available' : 'Booked', 
                  description: device.specs || device.device_type?.description || '', 
                  image: device.image || "https://s40091.pcdn.co/uk/wp-content/uploads/sites/3/2024/08/POOL-HERO.jpg" 
                };

                return (
                  <StationCard
                    key={stationData.id}
                    station={stationData}
                    motionProps={{
                      initial: { opacity: 0, x: 50 },
                      whileInView: { opacity: 1, x: 0 },
                      viewport: { once: true, margin: '-50px' },
                      transition: { duration: 0.5, delay: index * 0.15 },
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}