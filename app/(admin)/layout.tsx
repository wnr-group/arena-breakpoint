"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/admin/layout/SideBar";
import { Topbar } from "@/components/admin/layout/TopBar";
import { SessionMonitor } from "@/components/admin/auth/SessionMonitor";
import { Toaster } from "sonner";
import AnimatedBackground from "@/components/customer/layout/AnimatedBackground";
import { NotificationProvider } from "@/lib/contexts/NotificationContext";
import { NotificationToastManager } from "@/components/admin/layout/NotificationToast";
import { AdminNotificationPolling } from "@/components/admin/layout/AdminNotificationPolling";
import { ScrollToTop } from "@/components/shared/ScrollToTop";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  return (
    <NotificationProvider>
      <ScrollToTop />
      <div className="flex h-screen bg-[var(--background)] overflow-hidden font-sans relative">
      {/* Animated purple background - same as customer pages */}
      <AnimatedBackground />

      {/* Session Monitor for auto-redirect on expiry */}
      {!isLoginPage && <SessionMonitor />}

      {/* Notification System */}
      {!isLoginPage && <AdminNotificationPolling />}
      {!isLoginPage && <NotificationToastManager />}

      <Toaster
        theme="dark"
        position="top-right"
        closeButton
        toastOptions={{
          style: {
            background: '#121212',
            color: '#ffffff',
            border: '1px solid #27272a',
          },
        }}
      />

      {/* 1. Left Sidebar (Dynamic Width Control) */}
      {!isLoginPage && (
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">

        {/* Top Navigation - Receives toggle trigger hook */}
        {!isLoginPage && (
          <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} onOpenSidebar={() => setSidebarOpen(true)} />
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          {children}
        </main>

      </div>
    </div>
    </NotificationProvider>
  );
}