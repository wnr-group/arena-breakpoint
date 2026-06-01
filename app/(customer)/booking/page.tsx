"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { setDeviceType, addAddon, removeAddon, setPricing } from "@/lib/redux/slices/bookingSlice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, Minus, X, Info, Users } from "lucide-react";
import { getDeviceTypesWithAvailability } from "./actions";

const constantPeripheralCatalog = [
  { id: "extra-player", name: "EXTRA PLAYER", price: 50, desc: "Paddles for multiplayer pairing control setups." },
];

export default function GamingStationPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const reduxAddons = useAppSelector((state) => state.booking.addons);

  const [loading, setLoading] = useState(true);
  const [deviceTypes, setDeviceTypes] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState("All Devices");
  const [selectedDeviceType, setSelectedDeviceType] = useState<any | null>(null);

  useEffect(() => {
    async function loadDeviceTypes() {
      const res = await getDeviceTypesWithAvailability();
      if (res.success) setDeviceTypes(res.deviceTypes);
      setLoading(false);
    }
    loadDeviceTypes();
  }, []);

  const totalAddonsPrice = useMemo(() => {
    return reduxAddons.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [reduxAddons]);

  const activeBaseCost = selectedDeviceType?.regular_hourly_rate ? Number(selectedDeviceType.regular_hourly_rate) : 0;
  const definitiveCombinedTotalValue = activeBaseCost + totalAddonsPrice;

  const handleSelectDeviceType = (deviceType: any) => {
    dispatch(setDeviceType({
      id: deviceType.id,
      name: deviceType.display_name,
      hourlyRate: Number(deviceType.regular_hourly_rate),
      includedPlayers: deviceType.included_players,
      maxPlayers: deviceType.max_players,
      extraPlayerCharge: Number(deviceType.extra_player_charge)
    }));
    setSelectedDeviceType(deviceType);
  };

  const handleModifyAddonQty = (addon: typeof constantPeripheralCatalog[0], actionType: "add" | "remove") => {
    if (actionType === "add") {
      dispatch(addAddon({ id: addon.id, name: addon.name, price: addon.price }));
    } else {
      dispatch(removeAddon(addon.id));
    }
  };

  const handleCommitSelectionAndForward = () => {
    dispatch(setPricing({ subtotal: activeBaseCost, subscriptionDiscount: 0, promoDiscount: 0, total: definitiveCombinedTotalValue }));
    setSelectedDeviceType(null);
    router.push("/booking/slots");
  };

  if (loading) {
    return (
      <div className="h-[50vh] flex items-center justify-center"><Loader2 className="h-5 w-5 text-[#FFC107] animate-spin" /></div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12">
      <div className="space-y-1">
        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">HOME › BOOK SLOT › <span className="text-primary">SELECT DEVICE</span></p>
        <h2 className="text-xl font-black uppercase text-white tracking-tight">CHOOSE YOUR GAMING STATION</h2>
        <p className="text-primary text-[10px] font-black uppercase tracking-widest">• UPDATES LIVE: 24 ACTIVE PLAYERS MATCHING</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-900 pb-4">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {["All Devices", "Console", "PC", "Snooker"].map((tag) => (
            <button key={tag} onClick={() => setActiveFilter(tag)} className={`px-4 py-2 text-[11px] font-black uppercase border rounded-md transition-all ${activeFilter === tag ? "bg-primary text-black border-transparent" : "bg-[#111] border-zinc-800 text-zinc-400"}`}>{tag}</button>
          ))}
        </div>
        <Button onClick={() => router.push("/")} variant="outline" className="border-zinc-800 text-[11px] font-black uppercase h-9 px-4 text-zinc-400">← BACK TO HOME</Button>
      </div>

      {/* DEVICE TYPES GRID CONTAINER */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7">
        {deviceTypes
          .filter(type => {
            if (activeFilter === "Console") return type.name === "ps5";
            if (activeFilter === "PC") return type.name === "gaming_pc";
            if (activeFilter === "Snooker") return type.name?.includes("snooker");
            return true;
          })
          .map((deviceType) => {
            const isAvail = deviceType.available_devices_count > 0;
            return (
              <Card key={deviceType.id} className="bg-[#111] border border-zinc-900 overflow-hidden flex flex-col justify-between rounded-xl shadow-lg group">
                <div className="h-52 w-full relative overflow-hidden border-b border-zinc-900/60 bg-zinc-950">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <h3 className="text-3xl font-black text-white/10 uppercase">{deviceType.display_name}</h3>
                  </div>
                  
                  {/* Floating Status Badges */}
                  {isAvail ? (
                    <span className="absolute top-4 right-4 bg-black/90 backdrop-blur-md border border-green-500/30 text-green-400 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-2xl flex items-center gap-1.5 z-30">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      {deviceType.available_devices_count} AVAILABLE
                    </span>
                  ) : (
                    <span className="absolute top-4 right-4 bg-black/95 backdrop-blur-md border border-red-500/30 text-red-500 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-2xl flex items-center gap-1.5 z-30">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      FULLY BOOKED
                    </span>
                  )}
                </div>

                {/* Content Panel Area */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <h4 className="font-black text-sm text-white uppercase tracking-tight">
                          {deviceType.display_name}
                        </h4>
                        <p className="text-[10px] text-zinc-500 font-bold mt-0.5 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {deviceType.included_players} included • Max {deviceType.max_players}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-base font-black text-primary">₹{Number(deviceType.regular_hourly_rate)}</span>
                        <span className="text-[9px] text-zinc-600 block">/hr</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2 font-medium bg-zinc-950/40 p-2 rounded border border-zinc-900/60">
                      {deviceType.description || "Premium gaming experience with top-tier equipment."}
                    </p>
                  </div>

                  <div className="pt-2">
                    {isAvail ? (
                      <Button onClick={() => handleSelectDeviceType(deviceType)} className="w-full text-xs font-black uppercase py-5 bg-primary hover:bg-primary-hover text-black rounded-lg transition-all active:scale-[0.99]">
                        SELECT {deviceType.display_name.toUpperCase()}
                      </Button>
                    ) : (
                      <Button disabled className="w-full text-xs font-black uppercase py-5 bg-zinc-900 border border-zinc-800 text-zinc-600 rounded-lg cursor-not-allowed">
                        FULLY BOOKED
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
      </div>

      {/* ADD-ONS INTERCEPT MODAL PANEL */}
      {selectedDeviceType && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 animate-in fade-in duration-150">
          <Card className="w-full max-w-sm bg-[#121212] border-t border-zinc-800 sm:border border-zinc-800/80 rounded-t-2xl sm:rounded-2xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-250">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <div>
                <p className="text-[8px] text-zinc-500 font-black tracking-widest uppercase">HOME › BOOK SLOT › ADD-ONS</p>
                <h3 className="font-black text-sm text-white uppercase mt-0.5">CUSTOMIZE YOUR EXPERIENCE</h3>
              </div>
              <button onClick={() => setSelectedDeviceType(null)} className="p-1.5 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-500"><X className="h-4 w-4"/></button>
            </div>
            
            {/* Dynamic Station Header Identification Banner */}
            <div className="bg-zinc-950 p-3 rounded-lg flex flex-col gap-1.5 text-xs border border-zinc-900">
              <div className="flex justify-between items-center">
                <span className="font-black text-primary uppercase">
                  {selectedDeviceType.device_type?.display_name?.toUpperCase() || 'DEVICE'} — STATION #{selectedDeviceType.station_number}
                </span>
                <span className="text-white font-black">₹{selectedDeviceType.device_type?.regular_hourly_rate ? Number(selectedDeviceType.device_type.regular_hourly_rate) : 0}.00/hr</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-tight border-t border-zinc-900 pt-1.5 flex gap-1 items-start">
                <Info className="h-3 w-3 text-zinc-600 flex-shrink-0 mt-0.5" />
                <span>{selectedDeviceType.specs || "Active high-performance configuration asset block hold selection."}</span>
              </p>
            </div>

            {/* Peripheral Item Addons Mapping Rows */}
            <div className="space-y-2">
              {constantPeripheralCatalog.map((addon) => {
                const snapshot = reduxAddons.find(a => a.id === addon.id);
                const activeUnits = snapshot ? snapshot.quantity : 0;
                return (
                  <div key={addon.id} className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-0.5 min-w-0">
                      <h5 className="text-xs font-black text-white uppercase truncate">{addon.name}</h5>
                      <p className="text-[10px] text-zinc-500 line-clamp-1 pr-2 font-medium">{addon.desc}</p>
                      <p className="text-[10px] font-black text-primary pt-0.5">₹{addon.price}.00</p>
                    </div>
                    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1 rounded-lg flex-shrink-0">
                      <button onClick={() => handleModifyAddonQty(addon, "remove")} className="p-1 text-zinc-500 hover:text-white transition-all"><Minus className="h-3 w-3"/></button>
                      <span className="text-xs font-black text-white w-4 text-center">{activeUnits}</span>
                      <button onClick={() => handleModifyAddonQty(addon, "add")} className="p-1 text-black bg-primary hover:bg-primary-hover rounded transition-all"><Plus className="h-3 w-3"/></button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-zinc-950 p-3 rounded-xl space-y-1 text-xs text-zinc-500 border border-zinc-900">
              <div className="flex justify-between"><span>Base Runtime Rate</span><span className="text-white">₹{activeBaseCost}.00</span></div>
              <div className="flex justify-between font-black text-white pt-2 border-t border-zinc-800"><span>Total Summary Amount</span><span className="text-primary">₹{definitiveCombinedTotalValue}.00</span></div>
            </div>

            <div className="space-y-2">
              <Button onClick={handleCommitSelectionAndForward} className="w-full bg-primary hover:bg-primary-hover text-black font-black uppercase py-4 text-xs rounded-xl transition-all">
                CONTINUE TO SLOT SELECTION
              </Button>
              <Button onClick={() => setSelectedDeviceType(null)} variant="ghost" className="w-full border border-zinc-800 text-zinc-400 hover:text-white font-black text-xs py-4 rounded-xl">
                ← BACK TO STATIONS
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}