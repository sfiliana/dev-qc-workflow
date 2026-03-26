"use client";

import { KanbanBoard } from "@/components/kanban/kanban-board";
import { LayoutDashboard, Users, LogOut } from "lucide-react";
import { useState, useEffect } from "react";

export default function Home() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  // Simulasi cek login sederhana
  useEffect(() => {
    const savedUser = localStorage.getItem("activeUser");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("activeUser");
    window.location.reload(); // Kembali ke halaman login (jika login page sudah dibuat di kanban-board)
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          {/* SISI KIRI: Judul */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-lg bg-primary/10 p-2">
              <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold uppercase tracking-tight">
                Dev-QC Workflow
              </h1>
              <p className="text-xs text-muted-foreground">
                Internal Project Management System
              </p>
            </div>
          </div>

          {/* SISI KANAN: User Info & Logout (Sejajar Judul) */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none">{user.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{user.role}</p>
              </div>
            )}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white px-3 py-1.5 rounded-md text-xs font-bold transition-all border border-rose-500/20"
            >
              <LogOut className="h-3 w-3" />
              LOGOUT
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden">
        <KanbanBoard />
      </main>
    </div>
  );
}
