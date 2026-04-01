"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Tag, Calendar, UserPlus, 
  Check, X, Upload, History, Minimize2, Maximize2, Timer, ShieldCheck, Code2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  type Task, type Person, type TaskType, type PriorityLevel, priorityConfig, 
  priorityOptions, availableQCers, availableDevelopers, getInitials, 
  getAvatarColor, formatDate, formatDateTime
} from "@/lib/kanban-types";

interface TaskCardProps {
  task: Task;
  onMoveForward?: () => void;
  onMoveBackward?: () => void;
  onAssignQC?: (qcId: string) => void;
  onRemoveQC?: (qcId: string) => void;
  onAssignDeveloper?: (devId: string) => void;
  onRemoveDeveloper?: (devId: string) => void;
  onToggleUploaded?: () => void;
  onToggleCollapsed?: () => void;
  onChangePriority?: (taskType: TaskType, priority: PriorityLevel) => void;
  canMoveForward: boolean;
  canMoveBackward: boolean;
}

// --- Komponen Hitung Total Waktu (Akumulasi Semua User) ---
function TotalTimeBadge({ task }: { task: Task }) {
  const [totalStr, setTotalStr] = useState("00:00:00");
  const showTime = task.status === "DEVELOPMENT" || task.status === "QC TEST" || task.status === "DONE";

  useEffect(() => {
    if (!showTime) return;
    const calculate = () => {
      const users = [...task.developers, ...task.qcAssignees];
      let totalSeconds = 0;
      users.forEach(u => {
        const val = localStorage.getItem(`timer-${task.id}-${u.id}`);
        if (val) totalSeconds += parseInt(val, 10);
      });
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      setTotalStr(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    };
    calculate();
    const interval = setInterval(calculate, 2000); // Update setiap 2 detik
    return () => clearInterval(interval);
  }, [task, showTime]);

  if (!showTime) return null;

  return (
    <div className="flex items-center gap-1 text-primary font-mono text-[10px] mt-1 bg-primary/5 px-1.5 py-0.5 rounded border border-primary/20 w-fit">
      <Timer className="h-3 w-3" />
      <span>Total: {totalStr}</span>
    </div>
  );
}

function ClickableAvatar({ person, size = "sm" }: { person: Person, size?: "sm" | "md" }) {
  const s = size === "sm" ? "h-6 w-6 text-[9px]" : "h-7 w-7 text-[10px]";
  return (
    <Link href={`/user/${person.id}`} className={cn("flex items-center justify-center rounded-full border-2 border-card text-white font-bold transition-transform hover:scale-110", s, getAvatarColor(person.id))}>
      {getInitials(person.name)}
    </Link>
  );
}

export function TaskCard({ 
  task, onMoveForward, onMoveBackward, onAssignQC, onRemoveQC, 
  onAssignDeveloper, onRemoveDeveloper, onToggleUploaded, 
  onToggleCollapsed, onChangePriority, canMoveForward, canMoveBackward 
}: TaskCardProps) {
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [isDevPopoverOpen, setIsDevPopoverOpen] = useState(false);
  const [isQCPopoverOpen, setIsQCPopoverOpen] = useState(false);
  const [isPriorityPopoverOpen, setIsPriorityPopoverOpen] = useState(false);

  const status = task.status;
  const isBacklog = status === "BACKLOG";
  const isDev = status === "DEVELOPMENT";
  const isQC = status === "QC TEST";
  const isDone = status === "DONE";
  const priority = priorityConfig[`${task.taskType}-${task.priority}` as keyof typeof priorityConfig];

  const availDevs = availableDevelopers.filter(d => !task.developers.some(ad => ad.id === d.id));
  const availQCs = availableQCers.filter(q => !task.qcAssignees.some(aq => aq.id === q.id));

  // --- 1. UPLOADED STATE (Kartu Hijau) ---
  if (task.isUploaded) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Check className="h-4 w-4 text-emerald-400" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-emerald-400/70 truncate">{task.projectName}</p>
              <h3 className="text-sm font-medium text-emerald-400 truncate">{task.title}</h3>
              <TotalTimeBadge task={task} />
            </div>
          </div>
          <button onClick={onToggleUploaded} className="text-emerald-400/50 hover:text-emerald-400"><X className="h-4 w-4"/></button>
        </div>
      </div>
    );
  }

  // --- 2. COLLAPSED STATE (Shrink) ---
  if (task.isCollapsed) {
    return (
      <div className="group rounded-lg border bg-card p-3 shadow-sm hover:border-primary/50 transition-all">
        <div className="flex justify-between items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-muted-foreground truncate">{task.projectName}</p>
            <h3 className="text-sm font-medium truncate">{task.title}</h3>
            <TotalTimeBadge task={task} />
          </div>
          <button onClick={onToggleCollapsed} className="p-1 text-muted-foreground"><Maximize2 className="h-4 w-4"/></button>
        </div>
      </div>
    );
  }

  // --- 3. FULL VIEW ---
  return (
    <div className="group rounded-lg border bg-card p-4 shadow-md hover:border-primary/50 transition-all">
      {/* Header & Priority */}
      <div className="flex justify-between items-start mb-2 gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted-foreground">{task.projectName}</p>
          <h3 className="font-bold text-sm leading-tight text-balance">{task.title}</h3>
          <TotalTimeBadge task={task} />
        </div>
        <div className="flex gap-1 shrink-0">
          <Popover open={isPriorityPopoverOpen} onOpenChange={setIsPriorityPopoverOpen}>
            <PopoverTrigger asChild>
              <button className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase", priority.bgColor, priority.textColor, priority.borderColor)}>
                {priority.label}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-1" align="end">
              <p className="text-[10px] font-bold p-2 text-muted-foreground uppercase">Set Priority</p>
              {priorityOptions.map((opt) => (
                <button 
                  key={`${opt.taskType}-${opt.priority}`} 
                  onClick={() => { onChangePriority?.(opt.taskType, opt.priority); setIsPriorityPopoverOpen(false); }}
                  className="w-full text-left p-2 text-xs hover:bg-secondary rounded flex justify-between items-center"
                >
                  <span>{opt.taskType} - {opt.priority}</span>
                  {task.taskType === opt.taskType && task.priority === opt.priority && <Check className="h-3 w-3 text-primary"/>}
                </button>
              ))}
            </PopoverContent>
          </Popover>
          <button onClick={onToggleCollapsed} className="p-1 text-muted-foreground hover:bg-secondary rounded"><Minimize2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Calendar className="h-3 w-3" />
        <span>{formatDate(task.movedDate || task.receivedDate)}</span>
      </div>

      {/* Deskripsi & Audit Trail (Lengkap) */}
      <div className="mb-3">
        <button onClick={() => setIsDescriptionOpen(!isDescriptionOpen)} className="w-full flex justify-between items-center bg-secondary/50 px-2 py-1.5 rounded text-[11px] font-medium text-muted-foreground">
          <span>Deskripsi & Log</span> {isDescriptionOpen ? <ChevronUp className="h-3 w-3"/> : <ChevronDown className="h-3 w-3"/>}
        </button>
        {isDescriptionOpen && (
          <div className="mt-2 space-y-3 bg-secondary/20 p-2.5 rounded border border-border">
            <p className="text-xs text-muted-foreground leading-relaxed italic">"{task.description}"</p>
            <div className="border-t border-border pt-2">
                <div className="flex items-center gap-1 mb-1.5 text-[9px] font-black text-muted-foreground uppercase tracking-widest"><History className="h-3 w-3"/> Activity Log</div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {task.auditTrail.slice().reverse().map((log, i) => (
                        <div key={i} className="text-[10px] leading-tight border-l-2 border-primary/20 pl-2">
                          <span className="text-primary font-bold">{log.by}</span> {log.action}
                          <div className="text-[8px] opacity-40">{formatDateTime(log.timestamp)}</div>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-4">
        {task.tags.map((t) => <span key={t} className="px-1.5 py-0.5 bg-secondary text-[9px] rounded font-medium flex items-center gap-1"><Tag className="h-2.5 w-2.5"/>{t}</span>)}
      </div>

      {/* --- DEVELOPER SECTION --- */}
      <div className={cn("mb-2 p-2 rounded-md border", (isDev || isQC) ? "bg-blue-500/5 border-blue-500/20" : "bg-secondary/20 border-transparent")}>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] font-bold text-blue-400 flex items-center gap-1 uppercase"><Code2 className="h-3 w-3"/> Developers</span>
          {(isDev || isQC) && (
            <Popover open={isDevPopoverOpen} onOpenChange={setIsDevPopoverOpen}>
              <PopoverTrigger asChild><button className="text-[10px] text-blue-400 hover:underline font-bold">+ Assign</button></PopoverTrigger>
              <PopoverContent className="w-52 p-1" align="end">
                {availDevs.length > 0 ? availDevs.map(d => (
                  <button key={d.id} onClick={() => { onAssignDeveloper?.(d.id); setIsDevPopoverOpen(false); }} className="w-full text-left p-2 text-xs hover:bg-secondary rounded flex items-center gap-2">
                    <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-[8px] text-white", getAvatarColor(d.id))}>{getInitials(d.name)}</div>
                    <span className="truncate">{d.name}</span>
                  </button>
                )) : <p className="text-[10px] p-2 text-center text-muted-foreground">No devs available</p>}
              </PopoverContent>
            </Popover>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {task.developers.map((d) => (
            <div key={d.id} className="flex items-center gap-1 bg-blue-500/10 rounded-full pr-1.5 border border-blue-500/10">
              <ClickableAvatar person={d} />
              <span className="text-[9px] text-blue-300 font-medium">{d.name.split(" ")[0]}</span>
              {(isDev || isQC) && <button onClick={() => onRemoveDeveloper?.(d.id)} className="text-blue-400/50 hover:text-red-400 transition-colors"><X className="h-2.5 w-2.5"/></button>}
            </div>
          ))}
          {task.developers.length === 0 && <span className="text-[9px] text-muted-foreground italic">None assigned</span>}
        </div>
      </div>

      {/* --- QC SECTION --- */}
      <div className={cn("mb-3 p-2 rounded-md border", isQC ? "bg-amber-500/5 border-amber-500/20" : "bg-secondary/20 border-transparent")}>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1 uppercase"><ShieldCheck className="h-3 w-3"/> QC Assignees</span>
          {isQC && (
            <Popover open={isQCPopoverOpen} onOpenChange={setIsQCPopoverOpen}>
              <PopoverTrigger asChild><button className="text-[10px] text-amber-400 hover:underline font-bold">+ Assign</button></PopoverTrigger>
              <PopoverContent className="w-52 p-1" align="end">
                {availQCs.length > 0 ? availQCs.map(q => (
                  <button key={q.id} onClick={() => { onAssignQC?.(q.id); setIsQCPopoverOpen(false); }} className="w-full text-left p-2 text-xs hover:bg-secondary rounded flex items-center gap-2">
                    <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-[8px] text-white", getAvatarColor(q.id))}>{getInitials(q.name)}</div>
                    <span className="truncate">{q.name}</span>
                  </button>
                )) : <p className="text-[10px] p-2 text-center text-muted-foreground">No QC available</p>}
              </PopoverContent>
            </Popover>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {task.qcAssignees.map((q) => (
            <div key={q.id} className="flex items-center gap-1 bg-amber-500/10 rounded-full pr-1.5 border border-amber-500/10">
              <ClickableAvatar person={q} />
              <span className="text-[9px] text-amber-500 font-medium">{q.name.split(" ")[0]}</span>
              {isQC && <button onClick={() => onRemoveQC?.(q.id)} className="text-amber-500/50 hover:text-red-400 transition-colors"><X className="h-2.5 w-2.5"/></button>}
            </div>
          ))}
          {task.qcAssignees.length === 0 && <span className="text-[9px] text-muted-foreground italic">None assigned</span>}
        </div>
      </div>

      {/* Footer Navigation & Upload */}
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-2">
            {isDone && (
              <label className="flex items-center gap-2 cursor-pointer group/upload" onClick={(e) => { e.preventDefault(); onToggleUploaded?.(); }}>
                <div className={cn("h-4 w-4 rounded border flex items-center justify-center transition-all", task.isUploaded ? "bg-emerald-500 border-emerald-500" : "border-muted-foreground group-hover/upload:border-emerald-500")}>
                  {task.isUploaded && <Check className="h-3 w-3 text-white" />}
                </div>
                <span className={cn("text-[10px] font-bold uppercase", task.isUploaded ? "text-emerald-500" : "text-muted-foreground group-hover/upload:text-emerald-500")}>Uploaded</span>
              </label>
            )}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveBackward} disabled={!canMoveBackward}><ChevronLeft className="h-4 w-4"/></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveForward} disabled={!canMoveForward}><ChevronRight className="h-4 w-4"/></Button>
        </div>
      </div>
    </div>
  );
}
