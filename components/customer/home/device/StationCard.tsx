import { Station } from '@/app/(customer)/home/device/page'
import { motion } from 'framer-motion'
export function StationCard({ station, motionProps }: { station: Station; motionProps: object }) {
  const avail = station.isAvailable

  return (
    // Outer wrapper: holds the hover border OUTSIDE overflow-hidden so it's never clipped
    <motion.div
      {...motionProps}
      className="group relative rounded-md aspect-[4/3] min-[581px]:aspect-[3/4] cursor-pointer
        border-3 border-transparent
        hover:border-amber-400
        hover:shadow-[0_0_24px_rgba(251,191,36,0.45)]
        transition-[border-color,box-shadow] duration-300"
    >
      <div className="relative w-full h-full rounded-md overflow-hidden">
        <p>{station.image}</p>
        {/* Background Image */}
        <img
          src={station.image}
          alt={station.name}
          className="absolute inset-0 w-full h-full  transition-transform duration-700 ease-[cubic-bezier(.25,1,.5,1)] group-hover:scale-105"
        />

        {/* Gradient Overlay*/}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10 transition-all duration-400 group-hover:from-black/98 group-hover:via-black/55" />

        {/* Station Number  */}
        <div className="absolute top-3 left-3.5 z-10 font-bold text-[10px] tracking-widest text-white/60 uppercase">
          {station.station_num}
        </div>

        {/* Availability Badge */}
        <div
          className={`absolute top-3 right-3.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[8px] min-[581px]:text-[9px] font-bold tracking-widest uppercase transition-transform duration-400 group-hover:-translate-y-1 ${
            avail
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50'
              : 'bg-red-500/20 text-red-300 border border-red-400/50'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${avail ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}
          />
          {station.availability}
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-3.5 pb-3.5 pt-5 min-[581px]:px-4 min-[581px]:pb-4 min-[581px]:pt-6 transition-transform duration-400 ease-[cubic-bezier(.25,1,.5,1)] group-hover:-translate-y-14">
          {/* Device Name */}
          <h3
            className={`font-black uppercase tracking-wide leading-tight mb-1.5 text-base min-[581px]:text-lg ${avail ? 'text-amber-400' : 'text-white/70'}`}
            style={{ fontFamily: "'Rajdhani', sans-serif" }}
          >
            {station.name}
          </h3>

          {/* Price  */}
          <div className="flex items-baseline gap-1.5 mb-2 min-[581px]:mb-3">
            <span
              className="text-white font-black text-xl min-[581px]:text-2xl leading-none"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
            >
              ₹{station.regular_hourly_rate}
            </span>
            <span className="text-white/65 text-[9px] font-semibold uppercase tracking-widest">
              / hr
            </span>
          </div>

          {/* Meta Pills */}
          <div className="flex flex-wrap gap-1 min-[581px]:gap-1.5 mb-2 min-[581px]:mb-3">
            <span className="bg-white/12 border border-white/25 rounded-full text-[10px] min-[581px]:text-[12px] text-white/80 px-2 min-[581px]:px-2.5 py-0.5 min-[581px]:py-1 font-medium tracking-wide">
              Incl. <span className="text-white font-semibold">{station.included_players}</span>{' '}
              players
            </span>
            <span className="bg-white/12 border border-white/25 rounded-full text-[10px] min-[581px]:text-[12px] text-white/80 px-2 min-[581px]:px-2.5 py-0.5 min-[581px]:py-1 font-medium tracking-wide">
              Max <span className="text-white font-semibold">{station.max_players}</span>
            </span>
            {station.extra_player_charge > 0 ? (
              <span className="bg-white/12 border border-white/25 rounded-full text-[10px] min-[581px]:text-[12px] text-white/80 px-2 min-[581px]:px-2.5 py-0.5 min-[581px]:py-1 font-medium tracking-wide">
                +<span className="text-white font-semibold">₹{station.extra_player_charge}</span>
                /extra
              </span>
            ) : (
              <span className="bg-white/12 border border-white/25 rounded-full text-[10px] min-[581px]:text-[12px] text-white/80 px-2 min-[581px]:px-2.5 py-0.5 min-[581px]:py-1 font-medium tracking-wide">
                <span className="text-white font-semibold">No</span> extra charge
              </span>
            )}
          </div>

          {/* Description */}
          <p className="hidden min-[581px]:block text-white/60 text-[13px] leading-relaxed line-clamp-2">
            {station.description}
          </p>
        </div>

        {/* Book Station Button */}
        <div className="absolute bottom-3.5 min-[581px]:bottom-4 left-3.5 min-[581px]:left-4 right-3.5 min-[581px]:right-4 z-20 translate-y-5 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400 ease-[cubic-bezier(.25,1,.5,1)]">
          <button
            disabled={!avail}
            className={`w-full py-2.5 min-[581px]:py-3 rounded-xl font-black text-[12px] min-[581px]:text-[13px] tracking-widest uppercase transition-colors duration-200 ${
              avail
                ? 'bg-amber-400 text-black hover:bg-amber-300 active:scale-95'
                : 'bg-white/6 text-white/25 border border-white/10 cursor-not-allowed'
            }`}
            style={{ fontFamily: "'Rajdhani', sans-serif" }}
          >
            {avail ? 'Book Station' : 'Join Waitlist'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
