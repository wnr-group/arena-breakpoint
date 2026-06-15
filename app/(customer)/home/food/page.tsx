"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, useInView, AnimatePresence, Variants } from 'framer-motion';
import { Loader2 } from "lucide-react";
import { FoodCard } from '@/components/customer/home/food/FoodCard';
import { getMenuItems } from './action';

export interface Food {
  id: number;
  title: string;
  price: string;
  image: string;
  description: string; // <-- ADDED
  categories: string[];
}

interface FilterOption {
  label: string;
  value: string;
}

// --- Heading animations ---
const fadeUpVariants: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const skewInVariants: Variants = {
  hidden:  { opacity: 0, skewY: 6, y: 30 },
  visible: { opacity: 1, skewY: 0, y: 0, transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] } },
};

// --- Main ---
export default function FoodCollection() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [isFiltering, setIsFiltering] = useState(false);
  const [foodItems, setFoodItems] = useState<Food[]>([]);
  const [filters, setFilters] = useState<FilterOption[]>([{ label: "All Menu", value: "all" }]);
  const [isLoading, setIsLoading] = useState(true);

  const headingRef = useRef(null);
  const headingInView = useInView(headingRef, { once: true, margin: "-50px" });

  // Fetch dynamic data and extract dynamic categories
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const res = await getMenuItems();
        if (res.success && res.menuItems) {
          const mappedData: Food[] = res.menuItems.map((item: any) => ({
            id: item.id,
            title: item.name,
            price: `₹${item.price}`,
            description: item.description || "A delicious choice from our menu.",
            image: item.image_url || "https://images.unsplash.com/photo-1561758033-d89a9ad46330?q=80&w=600&auto=format&fit=crop",
            categories: [item.category?.toLowerCase() || 'other', 'all'],
          }));
          setFoodItems(mappedData);

          const uniqueCategories = new Set(
            res.menuItems
              .map((item: any) => item.category?.toLowerCase())
              .filter((cat: any) => cat)
          );

          const dynamicFilters: FilterOption[] = [{ label: "All Menu", value: "all" }];
          
          uniqueCategories.forEach((cat) => {
            if (typeof cat === 'string') {
              dynamicFilters.push({
                label: cat.charAt(0).toUpperCase() + cat.slice(1),
                value: cat
              });
            }
          });
          
          setFilters(dynamicFilters);
        }
      } catch (error) {
        console.error("Failed to fetch menu items", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleFilter = (value: string) => {
    setIsFiltering(true);
    setActiveFilter(value);
  };

  const filtered = activeFilter === 'all'
    ? foodItems
    : foodItems.filter(f => f.categories.includes(activeFilter));

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

      <div className="max-w-7xl mx-auto px-4 relative z-10">

        {/* Header */}
        <div
          ref={headingRef}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10"
        >
          <div>
            <motion.div variants={fadeUpVariants} initial="hidden" animate={headingInView ? "visible" : "hidden"} className="mb-2">
              <span className="text-[13px] font-semibold uppercase tracking-[0.18em]" style={{ color: '#ADB7BE' }}>
                Arena Kitchen
              </span>
            </motion.div>
            <motion.h2
              variants={skewInVariants}
              initial="hidden"
              animate={headingInView ? "visible" : "hidden"}
              className="text-3xl md:text-4xl font-extrabold uppercase leading-tight text-gradient-primary"
             
            >
              Food & Drinks
            </motion.h2>
          </div>

          {/* Dynamic Filter buttons */}
          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            animate={headingInView ? "visible" : "hidden"}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2"
          >
            {filters.map((f) => {
              const isActive = activeFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => handleFilter(f.value)}
                  className={`px-4 py-1.5 rounded text-[12px] font-semibold uppercase tracking-wider transition-all duration-300 ${
                    isActive 
                      ? "bg-gradient-primary text-[#0a0a0a]" 
                      : "bg-white/5 text-[#ADB7BE] border border-white/10"
                  }`}
                  style={{ fontFamily: "'Oxanium', sans-serif" }}
                >
                  {f.label}
                </button>
              );
            })}
          </motion.div>
        </div>

        {/* Data View Layer */}
        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-24 gap-4 text-[#a1a1aa]">
            <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
            <p className="font-medium tracking-widest uppercase text-sm" style={{ fontFamily: "'Oxanium', sans-serif" }}>
              Loading Menu...
            </p>
          </div>
        ) : foodItems.length === 0 ? (
          <div className="text-center py-24 bg-[#121212]/50 border border-[#27272a]/50 rounded-2xl text-[#a1a1aa] backdrop-blur-sm">
            No items currently available.
          </div>
        ) : (
          // Grid
          <motion.div layout className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-6 gap-3.5">
            <AnimatePresence mode="popLayout">
              {filtered.map((food, i) => (
                <FoodCard
                  key={food.id}
                  food={food}
                  index={i}
                  isFiltering={isFiltering}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

      </div>
    </section>
  );
}