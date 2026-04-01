"use client";

import { use, useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ChevronDown, ChevronUp, Play, Pause, RotateCcw, Timer, Check, X, Pencil, Maximize2, Minimize2, History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type Task, type TaskStatus, priorityConfig, allUsers, getInitials, getAvatarColor, formatDateTime } from "@/lib/kanban-types";
import { initialTasks } from "@/lib/kanban-store";

const statusColors: Record<TaskStatus, { bg: string; text: string }> = {
  BACKLOG: { bg: "bg-slate-500/20", text: "text-slate-400" },
  DEVELOPMENT: { bg: "bg-blue-500/20", text: "text-blue-400" },
  "QC TEST": { bg: "bg-amber-500/20", text: "text-amber-400" },
  DONE: { bg: "bg-emerald-500/20", text: "text-emerald-400" },
};

function TaskTimer({ taskId, userId }: { taskId: string; userId: string }) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editH, setEditH] = useState("0");
  const [editM, setEditM] = useState("0");

  const storageKey = `timer-${taskId}-${userId}`;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setSeconds(parseInt(saved, 10));
  }, [storageKey]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          localStorage.setItem(storageKey, next.toString());
          return next;
        });
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRunning, storageKey]);

  const formatTime = (total: number) => {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 mt-2">
      <Timer className="h-4 w-4 text-muted-foreground" />
      {isEditing ? (
        <div className="flex items-center gap-1">
          <input type="number" value={editH} onChange={e => setEditH(e.target.value)} className="w-10 bg-background border rounded text-xs text-center" />
          <span className="text-xs">:</span>
          <input type="number" value={editM} onChange={e => setEditM(e.target.value)} className="w-10 bg-background border rounded text-xs text-center" />
          <button onClick={() => { setSeconds((parseInt(editH)||0)*3600 + (parseInt(editM)||0)*60); setIsEditing(false); }} className="text-emerald-400"><Check className="h-3.5 w-3.5"/></button>
          <button onClick={() => setIsEditing(false)} className="text-rose-400"><X className="h-3.5 w-3.5"/></button>
        </div>
      ) : (
        <span className="font-mono text-sm min-w-[65px]">{formatTime(seconds)}</span>
      )}
      <div className="flex items-center gap-1 ml-auto">
        {!isEditing && (
          <>
            <button onClick={() => setIsRunning(!isRunning)} className={cn("p-1 rounded", isRunning ? "text-amber-400" : "text-emerald-400")}>
              {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
            <button onClick={() => { setSeconds(0); localStorage.removeItem(storageKey); }} className="p-1 text-muted-foreground"><RotateCcw className="h-3.5 w-3.5" /></button>
            <button onClick={() => { setEditH(Math.floor(seconds/3600).toString()); setEditM(Math.floor((seconds%3600)/60).toString()); setIsEditing(true); }} className="p-1 text-muted-foreground"><Pencil className="h-3.5 w-3.5" /></button>
          </>
        )}
      </div>
    </div>
  );
}

function UserTaskCard({ task, userId, onToggleCollapsed }: any) {
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const showTimer = task.status === "DEVELOPMENT" || task.status === "QC TEST";

  if (task.isCollapsed && !task.isUploaded) {
    return (
      <div className="rounded-lg border bg-card p-3 shadow-sm flex justify-between items-center">
        <div className="truncate flex-1"><p className="text-[10px] text-muted-foreground">{task.projectName}</p><h3 className="text-sm font-medium truncate">{task.title}</h3></div>
        <button onClick={() => onToggleCollapsed(task.id)} className="p-1.5 text-muted-foreground"><Maximize2 className="h-4 w-4" /></button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 shadow-md">
      <div className="flex justify-between items-start mb-3">
        <div><p className="text-[10px] text-muted-foreground">{task.projectName}</p><h3 className="font-medium text-sm">{task.title}</h3></div>
        <div className="flex gap-1">
          <span className={cn("px-2 py-0.5 rounded-full text-[10px]", statusColors[task.status as TaskStatus].bg, statusColors[task.status as TaskStatus].text)}>{task.status}</span>
          <button onClick={() => onToggleCollapsed(task.id)} className="p-1 text-muted-foreground hover:bg-secondary rounded"><Minimize2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      {showTimer && <TaskTimer taskId={task.id} userId={userId} />}
      
      {/* Deskripsi & Log Activity (User Page) */}
      <button onClick={() => setIsDescriptionOpen(!isDescriptionOpen)} className="w-full flex justify-between items-center bg-secondary/30 p-2 rounded mt-3 text-xs">
        <span>Deskripsi & Log</span> {isDescriptionOpen ? <ChevronUp className="h-3 w-3"/> : <ChevronDown className="h-3 w-3"/>}
      </button>
      {isDescriptionOpen && (
        <div className="mt-2 space-y-3 p-2 bg-secondary/10 rounded border border-border text-xs">
          <p className="text-muted-foreground leading-relaxed">{task.description}</p>
          <div className="border-t pt-2">
            <div className="flex items-center gap-1 font-bold text-muted-foreground mb-1 uppercase text-[9px]"><History className="h-3 w-3"/> History</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {task.auditTrail.slice().reverse().map((log: any, i: number) => (
                <div key={i} className="text-[10px]"><span className="text-primary font-medium">{log.by}</span>: {log.action}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const user = allUsers.find(u => u.id === id);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  if (!user) return <div className="p-10 text-center font-bold">User Not Found</div>;

  const toggleCollapsed = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCollapsed: !t.isCollapsed } : t));
  };

  const userTasks = tasks.filter(t => user.role === "developer" ? t.developers.some(d => d.id === id) : t.qcAssignees.some(q => q.id === id));

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/"><Button variant="ghost" size="icon"><ArrowLeft /></Button></Link>
        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-white font-bold", getAvatarColor(user.id))}>{getInitials(user.name)}</div>
        <h1 className="text-xl font-bold">{user.name} - Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {userTasks.map(t => <UserTaskCard key={t.id} task={t} userId={id} onToggleCollapsed={toggleCollapsed} />)}
      </div>
    </div>
  );
}
