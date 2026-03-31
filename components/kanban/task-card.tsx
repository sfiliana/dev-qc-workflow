"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Tag, Calendar, UserPlus, 
  Check, X, Upload, History, Minimize2, Maximize2, Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  type Task, type Person, type TaskType, type PriorityLevel, priorityConfig, 
  priorityOptions, availableQCers, availableDevelopers, getInitials, 
  getAvatarColor, formatDate, formatDateTime
} from "@/lib/kanban-types";

// --- Komponen Hitung Total Waktu ---
function TotalTimeDisplay({ task }: { task: Task }) {
  const [totalStr, setTotalStr] = useState("00:00:00");

  useEffect(() => {
    const calc = () => {
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
    calc();
  }, [task]);

  if (task.status !== "DONE") return null;

  return (
    <div className="flex items-center gap-1.5 text-emerald-500 font-mono text-[11px] mt-1">
      <Timer className="h-3 w-3" />
      <span>Total Work: {totalStr}</span>
    </div>
  );
}

function ClickableAvatar({ person, size = "sm" }: { person: Person, size?: "sm" | "md" }) {
  const s = size === "sm" ? "h-6 w-6 text-[9px]" : "h-7 w-7 text-[10px]";
  return (
    <Link href={`/user/${person.id}`} className={cn("flex items-center justify-center rounded-full border-2 border-card text-white font-bold", s, getAvatarColor(person.id))}>
      {getInitials(person.name)}
    </Link>
  );
}

export function TaskCard({ task, onMoveForward, onMoveBackward, onAssignQC, onRemoveQC, onAssignDeveloper, onRemoveDeveloper, onToggleUploaded, onToggleCollapsed, onChangePriority, canMoveForward, canMoveBackward }: any) {
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [isDevPopoverOpen, setIsDevPopoverOpen] = useState(false);
  const [isQCPopoverOpen, setIsQCPopoverOpen] = useState(false);

  const isQcColumn = task.status === "QC TEST";
  const isBacklogOrDev = task.status === "BACKLOG" || task.status === "DEVELOPMENT";
  const priority = priorityConfig[`${task.taskType}-${task.priority}` as keyof typeof priorityConfig];

  const availDevs = availableDevelopers.filter(d => !task.developers.some((ad: any) => ad.id === d.id));
  const availQCs = availableQCers.filter(q => !task.qcAssignees.some((aq: any) => aq.id === q.id));

  // --- COLLAPSED VIEW ---
  if (task.isCollapsed && !task.isUploaded) {
    return (
      <div className="group rounded-lg border bg-card p-3 shadow-sm hover:border-primary/50 transition-all">
        <div className="flex justify-between items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-muted-foreground">{task.projectName}</p>
            <h3 className="text-sm font-medium truncate">{task.title}</h3>
            <TotalTimeDisplay task={task} />
          </div>
          <button onClick={onToggleCollapsed} className="p-1 text-muted-foreground hover:text-foreground"><Maximize2 className="h-4 w-4"/></button>
        </div>
      </div>
    );
  }

  // --- FULL VIEW ---
  return (
    <div className="group rounded-lg border bg-card p-4 shadow-md hover:border-primary/50 transition-all">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground">{task.projectName}</p>
          <h3 className="font-semibold text-sm leading-tight">{task.title}</h3>
          <TotalTimeDisplay task={task} />
        </div>
        <button onClick={onToggleCollapsed} className="p-1 text-muted-foreground hover:bg-secondary rounded"><Minimize2 className="h-3.5 w-3.5" /></button>
      </div>

      {/* Developer Assignment (BACKLOG, DEV, & QC TEST) */}
      {(isBacklogOrDev || isQcColumn) && (
        <div className="mb-3 p-2 rounded-md bg-blue-500/5 border border-blue-500/20">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-blue-400 flex items-center gap-1"><UserPlus className="h-3 w-3"/> Developers</span>
            <Popover open={isDevPopoverOpen} onOpenChange={setIsDevPopoverOpen}>
              <PopoverTrigger asChild><button className="text-[10px] text-blue-400 hover:underline">+ Add</button></PopoverTrigger>
              <PopoverContent className="w-48 p-1">
                {availDevs.map(d => (
                  <button key={d.id} onClick={() => { onAssignDeveloper?.(task.id, d.id); setIsDevPopoverOpen(false); }} className="w-full text-left p-2 text-xs hover:bg-secondary rounded flex items-center gap-2">
                    <div className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[8px] text-white", getAvatarColor(d.id))}>{getInitials(d.name)}</div>
                    {d.name}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-wrap gap-1">
            {task.developers.map((d: any) => (
              <div key={d.id} className="flex items-center gap-1 bg-blue-500/10 rounded-full pr-2">
                <ClickableAvatar person={d} />
                <span className="text-[9px] text-blue-300">{d.name.split(" ")[0]}</span>
                <button onClick={() => onRemoveDeveloper?.(task.id, d.id)} className="text-blue-400 hover:text-red-400"><X className="h-2 w-2"/></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QC Assignment (Hanya QC Column) */}
      {isQcColumn && (
        <div className="mb-3 p-2 rounded-md bg-amber-500/5 border border-amber-500/20">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1"><ShieldCheck className="h-3 w-3"/> QC Assignees</span>
            <Popover open={isQCPopoverOpen} onOpenChange={setIsQCPopoverOpen}>
              <PopoverTrigger asChild><button className="text-[10px] text-amber-400 hover:underline">+ Add</button></PopoverTrigger>
              <PopoverContent className="w-48 p-1">
                {availQCs.map(q => (
                  <button key={q.id} onClick={() => { onAssignQC?.(task.id, q.id); setIsQCPopoverOpen(false); }} className="w-full text-left p-2 text-xs hover:bg-secondary rounded flex items-center gap-2">
                    <div className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[8px] text-white", getAvatarColor(q.id))}>{getInitials(q.name)}</div>
                    {q.name}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-wrap gap-1">
            {task.qcAssignees.map((q: any) => (
              <div key={q.id} className="flex items-center gap-1 bg-amber-500/10 rounded-full pr-2">
                <ClickableAvatar person={q} />
                <span className="text-[9px] text-amber-300">{q.name.split(" ")[0]}</span>
                <button onClick={() => onRemoveQC?.(task.id, q.id)} className="text-amber-400 hover:text-red-400"><X className="h-2 w-2"/></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex justify-between items-center mt-3 pt-3 border-t">
        <div className="flex items-center gap-2">
            {task.status === "DONE" && (
                <label className="flex items-center gap-1 text-[10px] cursor-pointer" onClick={() => onToggleUploaded?.(task.id)}>
                    <div className={cn("h-3.5 w-3.5 border rounded flex items-center justify-center", task.isUploaded ? "bg-emerald-500" : "")}>
                        {task.isUploaded && <Check className="h-2.5 w-2.5 text-white"/>}
                    </div>
                    <span>Uploaded</span>
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
