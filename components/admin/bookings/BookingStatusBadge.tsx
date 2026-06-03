interface BookingStatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
}

export function BookingStatusBadge({ status, size = "md" }: BookingStatusBadgeProps) {
  const statusClean = String(status || "").toLowerCase().trim();

  const sizeClasses = {
    sm: "text-[8px] px-1.5 py-0.5",
    md: "text-[9px] px-2 py-0.5",
    lg: "text-[10px] px-2.5 py-1"
  };

  if (statusClean === "confirmed") {
    return (
      <span className={`inline-flex items-center gap-1 ${sizeClasses[size]} font-black text-white bg-gradient-to-r from-blue-600/80 to-blue-400/80 border-2 border-blue-400/60 rounded-full backdrop-blur-md whitespace-nowrap uppercase tracking-wide glow-secondary transition-all duration-300`}>
        <span className="w-1 h-1 rounded-full bg-white animate-pulse shadow-lg shadow-blue-400" />
        CONFIRMED
      </span>
    );
  }

  if (statusClean === "checked_in") {
    return (
      <span className={`inline-flex items-center gap-1 ${sizeClasses[size]} font-black text-white bg-gradient-success border-2 border-green-400/60 rounded-full backdrop-blur-md whitespace-nowrap uppercase tracking-wide shadow-lg shadow-green-500/30 transition-all duration-300`}>
        <span className="w-1 h-1 rounded-full bg-white animate-pulse shadow-lg shadow-green-400" />
        CHECKED IN
      </span>
    );
  }

  if (statusClean === "completed") {
    return (
      <span className={`inline-flex items-center gap-1 ${sizeClasses[size]} font-black text-zinc-300 bg-gradient-to-r from-zinc-700 to-zinc-600 border-2 border-zinc-500/60 rounded-full backdrop-blur-md whitespace-nowrap uppercase tracking-wide transition-all duration-300`}>
        <span className="w-1 h-1 rounded-full bg-zinc-400" />
        COMPLETED
      </span>
    );
  }

  if (statusClean === "cancelled") {
    return (
      <span className={`inline-flex items-center gap-1 ${sizeClasses[size]} font-black text-white bg-gradient-accent border-2 border-red-400/60 rounded-full backdrop-blur-md whitespace-nowrap uppercase tracking-wide shadow-lg shadow-red-500/30 transition-all duration-300`}>
        <span className="w-1 h-1 rounded-full bg-white" />
        CANCELLED
      </span>
    );
  }

  if (statusClean === "locked") {
    return (
      <span className={`inline-flex items-center gap-1 ${sizeClasses[size]} font-black text-black bg-gradient-primary border-2 border-yellow-300/60 rounded-full backdrop-blur-md whitespace-nowrap uppercase tracking-wide glow-primary transition-all duration-300`}>
        <span className="w-1 h-1 rounded-full bg-black animate-pulse shadow-lg shadow-yellow-600" />
        LOCKED
      </span>
    );
  }

  // Default/Unknown status
  return (
    <span className={`inline-flex items-center gap-1 ${sizeClasses[size]} font-black text-zinc-400 bg-black/60 border border-zinc-700 rounded-full backdrop-blur-md whitespace-nowrap uppercase tracking-wide`}>
      <span className="w-1 h-1 rounded-full bg-zinc-500" />
      {statusClean.toUpperCase()}
    </span>
  );
}
