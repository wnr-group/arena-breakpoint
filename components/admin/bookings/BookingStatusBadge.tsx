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
      <span className={`inline-flex items-center gap-1 ${sizeClasses[size]} font-black text-white bg-black/60 border border-blue-500/40 rounded-full backdrop-blur-md whitespace-nowrap uppercase tracking-wide`}>
        <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
        CONFIRMED
      </span>
    );
  }

  if (statusClean === "checked_in") {
    return (
      <span className={`inline-flex items-center gap-1 ${sizeClasses[size]} font-black text-white bg-black/60 border border-green-500/40 rounded-full backdrop-blur-md whitespace-nowrap uppercase tracking-wide`}>
        <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
        CHECKED IN
      </span>
    );
  }

  if (statusClean === "completed") {
    return (
      <span className={`inline-flex items-center gap-1 ${sizeClasses[size]} font-black text-white bg-black/60 border border-green-600/40 rounded-full backdrop-blur-md whitespace-nowrap uppercase tracking-wide`}>
        <span className="w-1 h-1 rounded-full bg-green-600" />
        COMPLETED
      </span>
    );
  }

  if (statusClean === "cancelled") {
    return (
      <span className={`inline-flex items-center gap-1 ${sizeClasses[size]} font-black text-white bg-black/60 border border-red-500/40 rounded-full backdrop-blur-md whitespace-nowrap uppercase tracking-wide`}>
        <span className="w-1 h-1 rounded-full bg-red-500" />
        CANCELLED
      </span>
    );
  }

  if (statusClean === "locked") {
    return (
      <span className={`inline-flex items-center gap-1 ${sizeClasses[size]} font-black text-white bg-black/60 border border-amber-500/40 rounded-full backdrop-blur-md whitespace-nowrap uppercase tracking-wide`}>
        <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
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
