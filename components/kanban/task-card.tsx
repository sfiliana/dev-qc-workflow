"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Tag, Calendar, UserPlus, Check, X, Upload, History, Minimize2, Maximize2, Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  type Task, type Person, type TaskType, type PriorityLevel, priorityConfig, priorityOptions, availableQCers, availableDevelopers, getInitials, getAvatarColor, formatDate, formatDateTime
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

// Komponen Kecil untuk Menghitung Total Waktu
function TotalTaskTimeBadge({ task }: { task: Task }) {
  const [totalTime, setTotalTime] = useState("00:00:00");

  useEffect(() => {
    const calculateTotal = () => {
      // Gabungkan semua orang yang ditugaskan (Dev + QC)
      const allParticipants = [...task.developers, ...task.qcAssignees];
      let totalSeconds = 0;

      allParticipants.forEach((person) => {
        const saved = localStorage.getItem(`timer-${task.id}-${person.id}`);
        if (saved) totalSeconds += parseInt(saved, 10);
      });

      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      setTotalTime(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    };

    calculateTotal();
    // Refresh setiap kali card dirender
  }, [task]);

  if (totalTime === "00:00:00") return null;

  return (
    <div className="flex items-center gap-1.5 rounded-md bg-secondary/80 px-2 py-1 text-[10px] font-mono text-foreground border border-border/50">
      <Timer className="h-3 w-3 text-primary" />
      <span>Total: {totalTime}</span>
    </div>
  );
}

function ClickableAvatar({ person, size = "md", showBorder = true, borderColor = "border-card" }: { person: Person, size?: "sm" | "md", showBorder?: boolean, borderColor?: string }) {
  const sizeClasses = size === "sm" ? "h-6 w-6 text-[9px]" : "h-7 w-7 text-[10px]";
  return (
    <Link href={`/user/${person.id}`} className={cn("flex items-center justify-center rounded-full font-semibold text-white transition-transform hover:scale-110", sizeClasses, showBorder && `border-2 ${borderColor}`, getAvatarColor(person.id))} title={person.name}>
      {getInitials(person.name)}
    </Link>
  );
}

export function TaskCard({ task, onMoveForward, onMoveBackward, onAssignQC, onRemoveQC, onAssignDeveloper, onRemoveDeveloper, onToggleUploaded, onToggleCollapsed, onChangePriority, canMoveForward, canMoveBackward }: TaskCardProps) {
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [isQCPopoverOpen, setIsQCPopoverOpen] = useState(false);
  const [isDevPopoverOpen, setIsDevPopoverOpen] = useState(false);
  const [isPriorityPopoverOpen, setIsPriorityPopoverOpen] = useState(false);

  const isQcColumn = task.status === "QC TEST";
  const isBacklogOrDev = task.status === "BACKLOG" || task.status === "DEVELOPMENT";
  const isDone = task.status === "DONE";
  const priority = priorityConfig[`${task.taskType}-${task.priority}` as keyof typeof priorityConfig];

  const availableQC = availableQCers.filter(qc => !task.qcAssignees.some(a => a.id === qc.id));
  const availableDevs = availableDevelopers.filter(d => !task.developers.some(a => a.id === d.id));

  // Collapsed View
  if (task.isCollapsed && !task.isUploaded) {
    return (
      <div className="group rounded-lg border border-border bg-card p-3 shadow-lg transition-all hover:border-primary/50">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-muted-foreground truncate">{task.projectName}</p>
            <h3 className="text-sm font-medium text-card-foreground truncate">{task.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <TotalTaskTimeBadge task={task} />
            <button onClick={onToggleCollapsed} className="p-1.5 text-muted-foreground hover:text-foreground"><Maximize2 className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    );
  }

  // Uploaded View
  if (task.isUploaded) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Check className="h-4 w-4 text-emerald-400" />
            <div className="min-w-0 flex-1"><p className="text-[10px] text-emerald-400/70 truncate">{task.projectName}</p><h3 className="text-sm font-medium text-emerald-400 truncate">{task.title}</h3></div>
          </div>
          <TotalTaskTimeBadge task={task} />
        </div>
      </div>
    );
  }

  return (
    <div className="group rounded-lg border border-border bg-card p-4 shadow-lg hover:border-primary/50 transition-all">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-muted-foreground mb-1">{task.projectName}</p>
          <h3 className="font-medium text-card-foreground leading-snug">{task.title}</h3>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={onToggleCollapsed} className="p-1 text-muted-foreground hover:bg-secondary rounded"><Minimize2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      {/* TOTAL TIME BADGE - Tampil di bawah judul */}
      <div className="mb-3">
        <TotalTaskTimeBadge task={task} />
      </div>

      <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Calendar className="h-3 w-3" />
        <span>{formatDate(task.movedDate || task.receivedDate)}</span>
      </div>

      {/* DEV ASSIGNEES */}
      {isBacklogOrDev && (
        <div className="mb-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-blue-400 flex items-center gap-2"><UserPlus className="h-3 w-3"/> Devs</span>
            <Popover open={isDevPopoverOpen} onOpenChange={setIsDevPopoverOpen}>
              <PopoverTrigger asChild><Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-blue-400 hover:bg-blue-500/20">+ Add</Button></PopoverTrigger>
              <PopoverContent className="w-64 p-0">
                <div className="max-h-48 overflow-y-auto p-2">
                  {availableDevs.map(dev => (
                    <button key={dev.id} onClick={() => { onAssignDeveloper?.(dev.id); setIsDevPopoverOpen(false); }} className="flex w-full items-center gap-3 p-2 hover:bg-secondary rounded-md">
                      <div className={cn("h-7 w-7 rounded-full flex items-center justify-center text-[10px] text-white", getAvatarColor(dev.id))}>{getInitials(dev.name)}</div>
                      <span className="text-sm">{dev.name}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-wrap gap-2">
            {task.developers.map(dev => (
              <div key={dev.id} className="flex items-center gap-1 bg-blue-500/20 rounded-full pl-1 pr-2 py-1">
                <ClickableAvatar person={dev} size="sm" borderColor="border-blue-500/30" />
                <span className="text-[10px] text-blue-300">{dev.name.split(" ")[0]}</span>
                <button onClick={() => onRemoveDeveloper?.(dev.id)} className="text-blue-400/70 hover:text-blue-300"><X className="h-3 w-3"/></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QC ASSIGNEES */}
      {isQcColumn && (
        <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-amber-400 flex items-center gap-2"><UserPlus className="h-3 w-3"/> QC</span>
            <Popover open={isQCPopoverOpen} onOpenChange={setIsQCPopoverOpen}>
              <PopoverTrigger asChild><Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-amber-400 hover:bg-amber-500/20">+ Add</Button></PopoverTrigger>
              <PopoverContent className="w-64 p-0">
                <div className="max-h-48 overflow-y-auto p-2">
                  {availableQC.map(qc => (
                    <button key={qc.id} onClick={() => { onAssignQC?.(qc.id); setIsQCPopoverOpen(false); }} className="flex w-full items-center gap-3 p-2 hover:bg-secondary rounded-md">
                      <div className={cn("h-7 w-7 rounded-full flex items-center justify-center text-[10px] text-white", getAvatarColor(qc.id))}>{getInitials(qc.name)}</div>
                      <span className="text-sm">{qc.name}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-wrap gap-2">
            {task.qcAssignees.map(qc => (
              <div key={qc.id} className="flex items-center gap-1 bg-amber-500/20 rounded-full pl-1 pr-2 py-1">
                <ClickableAvatar person={qc} size="sm" borderColor="border-amber-500/30" />
                <span className="text-[10px] text-amber-300">{qc.name.split(" ")[0]}</span>
                <button onClick={() => onRemoveQC?.(qc.id)} className="text-amber-400/70 hover:text-amber-300"><X className="h-3 w-3"/></button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border pt-3 mt-4">
         <div className="flex items-center gap-3">
           {isDone && (
              <label className="flex items-center gap-2 cursor-pointer group" onClick={() => onToggleUploaded?.()}>
                <div className={cn("h-4 w-4 rounded border flex items-center justify-center", task.isUploaded ? "bg-emerald-500" : "border-muted-foreground")}>
                  {task.isUploaded && <Check className="h-3 w-3 text-white"/>}
                </div>
                <span className="text-[10px] text-muted-foreground group-hover:text-emerald-400">Uploaded</span>
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
