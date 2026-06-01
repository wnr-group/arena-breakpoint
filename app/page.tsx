"use client";

import { Navbar } from "@/components/customer/layout/NavBar";
import { Footer } from "@/components/customer/layout/Footer";
import LandingPage from "./(customer)/page";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#060606]">
      <Navbar />
      <main className="flex-1 w-full max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        <LandingPage />
      </main>
      <Footer />
    </div>
  );
}