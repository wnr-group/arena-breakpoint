"use client";


import { Footer } from "@/components/customer/layout/Footer";
import LandingPage from "./(customer)/page";
import HeroCarousel from "./(customer)/page";
import Testimonials from "@/components/customer/home/Testimonials";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#060606]">
        <HeroCarousel></HeroCarousel>
        <Testimonials></Testimonials>
    </div>
  );
}