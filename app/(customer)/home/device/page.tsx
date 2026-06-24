"use client";

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from "lucide-react"
import { StationCard } from '@/components/customer/home/device/StationCard'
import { getDevices } from './action';
import { SkeletonGrid } from '@/components/shared/SkeletonCard';

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
  const videoRef = React.useRef<HTMLVideoElement>(null);

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

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleTimeUpdate = () => {
        if (video.currentTime >= 2) {
          video.pause();
        }
      };

      video.addEventListener('timeupdate', handleTimeUpdate);
      return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }
  }, []);

  return (
    <section id="features" className="relative min-h-screen py-24 overflow-hidden">

      {/* BG video — PS5 hero */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload="metadata"
        poster="/ps5_hero_poster.jpg"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      >
        <source src="/ps5_hero.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay with gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/80" style={{ zIndex: 1 }} />
 

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4" style={{ position: 'relative', zIndex: 10 }}>

        {/* Header */}
        <div className="text-left mb-16 flex flex-col items-start">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative inline-block"
          >
            <div className="absolute -top-8 left-0 w-24 h-24 bg-orange-600/15 blur-3xl rounded-full" />
            <h2
              className="relative text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-500 tracking-wide uppercase"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
            >
              Select Your Device
            </h2>
          </motion.div>
        </div>

        {/* Data */}
        <div className="mt-2">
          {isLoadingData ? (
            <SkeletonGrid count={8} className="grid-cols-1 min-[581px]:grid-cols-2 min-[787px]:grid-cols-3 min-[932px]:grid-cols-4" />
          ) : devicesArray.length === 0 ? (
            <div className="text-center py-24 bg-[#121212]/50 border border-[#27272a]/50 rounded-2xl text-[#a1a1aa] backdrop-blur-sm">
              No stations are currently available.
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 min-[581px]:grid-cols-2 min-[787px]:grid-cols-3 min-[932px]:grid-cols-4">
              {devicesArray.map((device, index) => {
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
                  image: device.image_url || "https://s40091.pcdn.co/uk/wp-content/uploads/sites/3/2024/08/POOL-HERO.jpg"
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