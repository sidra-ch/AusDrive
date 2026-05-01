"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { PageLoader } from "./loading";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const router = useRouter();

  // Silently refresh session — redirect to login only if refresh also fails
  useEffect(() => {
    async function refreshSession() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.status === 401) {
          router.replace("/auth/login");
        }
      } catch {
        // network error — keep user on page, try next interval
      }
    }

    refreshSession();

    // Re-check every 6 hours to auto-rotate tokens
    const interval = setInterval(refreshSession, 6 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [router]);

  // Close sidebar on mobile by default, open on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Simulate initial load time
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 800);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  return (
    <>
      {isInitialLoad && <PageLoader />}
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </>
  );
}
