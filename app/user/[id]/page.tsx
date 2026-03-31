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

const statusColors: Record<TaskStatus, { bg: string; text: string; border: string }> = {
  BACKLOG: { bg: "bg-slate-500/20", text: "text-slate-400", border: "border-slate-500/30" },
  DEVELOPMENT: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
  "QC TEST": { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" },
  DONE: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
};

// --- Timer Component ---
function TaskTimer({ taskId, userId }: { taskId: string, userId: string }) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editHours, setEditHours] = useState("0");
  const [editMinutes, setEditMinutes] = useState("0");

  // Gunakan localStorage agar data bisa diakses oleh Page Utama (Kanban Board)
  const storageKey = `timer-${taskId}-${userId}`;

  useEffect(() => {
    const savedTime = localStorage.getItem(storageKey);
    if (savedTime) setSeconds(parseInt(savedTime, 10));
  }, [storageKey]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          const newTime = prev + 1;
          localStorage.setItem(storageKey, newTime.toString());
          return newTime;
        });
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRunning, storageKey]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleReset = () => {
    if (confirm("Reset timer?")) {
      setSeconds(0);
      setIsRunning(false);
      localStorage.removeItem(storageKey);
    }
  };

  const saveEdit = () => {
    const newSeconds = (parseInt(editHours) || 0) * 3600 + (parseInt(editMinutes) || 0) * 60;
    setSeconds(newSeconds);
    localStorage.setItem(storageKey, newSeconds.toString());
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2">
      <Timer className="h-4 w-4 text-muted-foreground" />
      {isEditing ? (
        <div className="flex items-center gap-1">
          <input type="number" value={editHours} onChange={(e) => setEditHours(e.target.value)} className="w-10 rounded border bg-background text-xs text-center" />
          <span className="text-xs text-muted-foreground">h</span>
          <input type="number" value={editMinutes} onChange={(e) => setEditMinutes(e.target.value)} className="w-10 rounded border bg-background text-xs text-center" />
          <span className="text-xs text-muted-foreground">m</span>
          <button onClick={saveEdit} className="text-emerald-400 ml-1"><Check className="h-4 w-4" /></button>
          <button onClick={() => setIsEditing(false)} className="text-rose-400"><X className="h-4 w-4" /></button>
        </div>
      ) : (
        <span className="font-mono text-sm text-foreground min-w-[70px]">{formatTime(seconds)}</span>
      )}
      {!isEditing && (
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => setIsRunning(!isRunning)} className={cn("rounded-md p-1", isRunning ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400")}>
            {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <button onClick={handleReset} className="p-1 text-muted-foreground"><RotateCcw className="h-3.5 w-3.5" /></button>
          <button onClick={() => { setEditHours(Math.floor(seconds/3600).toString()); setEditMinutes(Math.floor((seconds%3600)/60).toString()); setIsEditing(true); setIsRunning(false); }} className="p-1 text-muted-foreground">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// --- Card & Page ---
function UserTaskCard({ task, userId, onToggleUploaded, onToggleCollapsed }: { task: Task; userId: string; onToggleUploaded: () => void; onToggleCollapsed: () => void }) {
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const priority = priorityConfig[`${task.taskType}-${task.priority}` as keyof typeof priorityConfig];
  const showTimer = task.status === "DEVELOPMENT" || task.status === "QC TEST";

  if (task.isCollapsed && !task.isUploaded) {
    return (
      <div className="rounded-lg border bg-card p-3 shadow-lg flex justify-between items-center">
        <div className="min-w-0 flex-1"><p className="text-[10px] text-muted-foreground truncate">{task.projectName}</p><h3 className="text-sm font-medium truncate">{task.title}</h3></div>
        <button onClick={onToggleCollapsed} className="p-1.5 text-muted-foreground"><Maximize2 className="h-4 w-4" /></button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 shadow-lg">
      <div className="mb-3 flex items-start justify-between">
        <div><p className="text-[10px] text-muted-foreground">{task.projectName}</p><h3 className="font-medium">{task.title}</h3></div>
        <div className="flex gap-1.5">
          <span className={cn("rounded-full px-2 py-0.5 text-[10px]", statusColors[task.status].bg, statusColors[task.status].text)}>{task.status}</span>
          <button onClick={onToggleCollapsed} className="p-1 text-muted-foreground"><Minimize2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      {showTimer && <TaskTimer taskId={task.id} userId={userId} />}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {task.tags.map(tag => <span key={tag} className="bg-secondary px-2 py-0.5 text-[10px] rounded flex items-center gap-1"><Tag className="h-3 w-3"/>{tag}</span>)}
      </div>
    </div>
  );
}

export default function UserTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const user = allUsers.find(u => u.id === id);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const userTasks = useMemo(() => {
    if (!user) return [];
    return tasks.filter(t => user.role === "developer" ? t.developers.some(d => d.id === id) : t.qcAssignees.some(q => q.id === id));
  }, [user, id, tasks]);

  if (!user) return <div className="p-10 text-center">User not found</div>;

  return (
    <div className="min-h-screen bg-background p-6">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/"><Button variant="ghost" size="icon"><ArrowLeft /></Button></Link>
          <div><h1 className="text-2xl font-bold">{user.name}</h1><p className="text-blue-400 capitalize">{user.role}</p></div>
        </div>
      </header>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {userTasks.map(task => (
          <UserTaskCard key={task.id} task={task} userId={id} onToggleUploaded={() => {}} onToggleCollapsed={() => {}} />
        ))}
      </div>
    </div>
  );
}
