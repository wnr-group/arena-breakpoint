export function StatusBadge({ status }: { status: string }) {
  const clean = String(status || "").toLowerCase().trim();

  if (clean === 'available') {
    return (
      <span className="inline-flex px-2 py-1 text-[10px] font-bold text-[#FFC107] border border-[#FFC107]/30 rounded uppercase bg-[#FFC107]/5 shadow-[0_0_10px_rgba(255,193,7,0.1)]">
        Available
      </span>
    );
  }

  if (clean === 'occupied') {
    return (
      <span className="inline-flex px-2 py-1 text-[10px] font-bold text-[#a1a1aa] border border-[#a1a1aa]/30 rounded uppercase bg-[#a1a1aa]/5">
        Occupied
      </span>
    );
  }

  if (clean === 'maintenance') {
    return (
      <span className="inline-flex px-2 py-1 text-[10px] font-bold text-[#f43f5e] border border-[#f43f5e]/30 rounded uppercase bg-[#f43f5e]/5">
        Maintenance
      </span>
    );
  }

  return (
    <span className="inline-flex px-2 py-1 text-[10px] font-bold text-zinc-500 border border-zinc-700 rounded uppercase">
      Inactive
    </span>
  );
}
