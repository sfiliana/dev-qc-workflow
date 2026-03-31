"use client";

import { use, useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  ChevronDown,
  ChevronUp,
  Code2,
  LogOut,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  RotateCcw,
  ShieldCheck,
  Tag,
  Timer,
  Upload,
  Check,
  History,
  User,
  Pencil,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type Task,
  type Person,
  type TaskStatus,
  priorityConfig,
  allUsers,
  getInitials,
  getAvatarColor,
  formatDate,
  formatDateTime,
} from "@/lib/kanban-types";
import { initialTasks } from "@/lib/kanban-store";

const statusColors: Record<
  TaskStatus,
  { bg: string; text: string; border: string }
> = {
  BACKLOG: {
    bg: "bg-slate-500/20",
    text: "text-slate-400",
    border: "border-slate-500/30",
  },
  DEVELOPMENT: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  "QC TEST": {
    bg: "bg-amber-500/20",
    text: "text-amber-400",
    border: "border-amber-500/30",
  },
  DONE: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
  },
};

// --- Timer Component with Edit Feature ---
function TaskTimer({ taskId }: { taskId: string }) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // State for manual input
  const [editHours, setEditHours] = useState("0");
  const [editMinutes, setEditMinutes] = useState("0");

  useEffect(() => {
    const savedTime = sessionStorage.getItem(`timer-${taskId}`);
    if (savedTime) {
      setSeconds(parseInt(savedTime, 10));
    }
  }, [taskId]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          const newTime = prev + 1;
          sessionStorage.setItem(`timer-${taskId}`, newTime.toString());
          return newTime;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, taskId]);

  const formatTime = useCallback((totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const handleReset = () => {
    if (confirm("Reset timer ke 00:00:00?")) {
      setSeconds(0);
      setIsRunning(false);
      sessionStorage.removeItem(`timer-${taskId}`);
    }
  };

  const startEditing = () => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    setEditHours(h.toString());
    setEditMinutes(m.toString());
    setIsEditing(true);
    setIsRunning(false); // Otomatis pause saat edit
  };

  const saveEdit = () => {
    const newSeconds = (parseInt(editHours) || 0) * 3600 + (parseInt(editMinutes) || 0) * 60;
    setSeconds(newSeconds);
    sessionStorage.setItem(`timer-${taskId}`, newSeconds.toString());
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2">
      <Timer className="h-4 w-4 text-muted-foreground" />
      
      {isEditing ? (
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={editHours}
            onChange={(e) => setEditHours(e.target.value)}
            className="w-10 rounded border border-border bg-background px-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary"
            min="0"
          />
          <span className="text-xs text-muted-foreground">h</span>
          <input
            type="number"
            value={editMinutes}
            onChange={(e) => setEditMinutes(e.target.value)}
            className="w-10 rounded border border-border bg-background px-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary"
            min="0"
            max="59"
          />
          <span className="text-xs text-muted-foreground">m</span>
          <button onClick={saveEdit} className="ml-1 text-emerald-400 hover:text-emerald-300">
            <Check className="h-4 w-4" />
          </button>
          <button onClick={() => setIsEditing(false)} className="text-r
