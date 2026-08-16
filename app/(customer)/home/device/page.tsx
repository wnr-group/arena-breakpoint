"use client";

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from "lucide-react"
import { StationCard } from '@/components/customer/home/device/StationCard'
import { getDevices } from './action';
import { SkeletonGrid } from '@/components/shared/SkeletonCard';

export interface Station {
  id: number
  device_type_id: string
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
  available_count?: number
  total_count?: number
}

/**
 * Customer-facing wording for a station's state.
 *
 * "Booked" covered all three not-available cases before, which told someone
 * standing in the arena the wrong thing twice over: a table under maintenance
 * is not booked, and one being played on right now is worth saying plainly.
 */
function describeAvailability(status: string): string {
  switch (status) {
    case 'occupied':
      return 'In Use';
    case 'maintenance':
      return 'Under Maintenance';
    case 'inactive':
      return 'Unavailable';
    default:
      return 'Available';
  }
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
      <style jsx>{`
        @media (min-width: 769px) {
          .video-container video {
            position: fixed !important;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
          }
        }
      `}</style>

      {/* BG video — PS5 hero with parallax effect on desktop */}
      <div className="video-container absolute inset-0" style={{ zIndex: 0 }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          preload="metadata"
          poster="/ps5_hero_poster.jpg"
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/ps5_hero.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Gradient overlay - same as food section */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, #1E1F22 0%, rgba(30,31,34,0.88) 50%, #1E1F22 100%)',
          zIndex: 1
        }}
      />

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
                const sameTypeDevices = devicesArray.filter(d => d.device_type_id === device.device_type_id || (d.device_type && device.device_type && d.device_type.id === device.device_type.id));
                const totalCount = sameTypeDevices.length;
                const availableCount = sameTypeDevices.filter(d => d.effective_status === 'available').length;

                const stationData: Station = {
                  id: device.id,
                  device_type_id: device.device_type?.id || '',
                  name: device.device_type?.display_name || 'Unknown Station',
                  station_num: device.station_number,
                  regular_hourly_rate: device.device_type?.regular_hourly_rate || 0,
                  included_players: device.device_type?.included_players || 1,
                  max_players: device.device_type?.max_players || 1,
                  extra_player_charge: device.device_type?.extra_player_charge || 0,
                  isAvailable: device.effective_status === 'available',
                  availability: describeAvailability(device.effective_status),
                  description: device.specs || device.device_type?.description || '',
                  image: device.image_url || "",
                  available_count: availableCount,
                  total_count: totalCount
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