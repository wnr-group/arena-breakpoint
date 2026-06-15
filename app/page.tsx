"use client";

import React from 'react';
import LandingPage from "./(customer)/page";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <LandingPage></LandingPage>
    </div>
  );
}