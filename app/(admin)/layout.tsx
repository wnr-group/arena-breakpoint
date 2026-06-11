"use client";

import { useState } from "react";
import { Sidebar } from "@/components/admin/layout/SideBar";
import { Topbar } from "@/components/admin/layout/TopBar";
import { SessionMonitor } from "@/components/admin/auth/SessionMonitor";
import { Toaster } from "sonner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden font-sans">
      {/* Session Monitor for auto-redirect on expiry */}
      <SessionMonitor />

      <Toaster 
        theme="dark" 
        position="top-right"
        toastOptions={{
          style: {
            background: '#121212',
            color: '#ffffff',
            border: '1px solid #27272a',
          },
        }} 
      />
      
      {/* 1. Left Sidebar (Dynamic Width Control) */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Navigation - Receives toggle trigger hook */}
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} onOpenSidebar={() => setSidebarOpen(true)} />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#0a0a0a]">
          {children}
        </main>
        
      </div>
    </div>
  );
}