interface PaymentStatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
}

export function PaymentStatusBadge({ status, size = "md" }: PaymentStatusBadgeProps) {
  const sizeClasses = {
    sm: "text-[9px] px-2 py-0.5",
    md: "text-[10px] px-2.5 py-1",
    lg: "text-xs px-3 py-1.5",
  };

  const statusConfig = {
    paid: {
      label: "Paid",
      bgClass: "bg-green-500/20 border-green-500/40 text-green-400",
    },
    pending: {
      label: "Pending",
      bgClass: "bg-amber-500/20 border-amber-500/40 text-amber-400",
    },
    partial: {
      label: "Partial",
      bgClass: "bg-orange-500/20 border-orange-500/40 text-orange-400",
    },
    failed: {
      label: "Failed",
      bgClass: "bg-red-500/20 border-red-500/40 text-red-400",
    },
    refunded: {
      label: "Refunded",
      bgClass: "bg-blue-500/20 border-blue-500/40 text-blue-400",
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    bgClass: "bg-zinc-500/20 border-zinc-500/40 text-zinc-400",
  };

  return (
    <span
      className={`inline-flex items-center font-black uppercase tracking-wider rounded-md border ${config.bgClass} ${sizeClasses[size]}`}
    >
      {config.label}
    </span>
  );
}
