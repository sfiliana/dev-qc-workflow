"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Tag,
  Calendar,
  UserPlus,
  Check,
  X,
  Upload,
  History,
  Minimize2,
  Maximize2,
  Clock,
  Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  type Task,
  type Person,
  type TaskType,
  type PriorityLevel,
  priorityConfig,
  priorityOptions,
  availableQCers,
  availableDevelopers, // Tambahkan ini
  getInitials,
  getAvatarColor,
  formatDate,
  formatDateTime,
} from "@/lib/kanban-types";

interface TaskCardProps {
  task: Task;
  onMoveForward?: () => void;
  onMoveBackward?: () => void;
  onAssignQC?: (qcId: string) => void;
  onRemoveQC?: (qcId: string) => void;
  onAssignDeveloper?: (devId: string) => void; // Tambahkan ini
  onRemoveDeveloper?: (devId: string) => void; // Tambahkan ini
  onToggleUploaded?: () => void;
  onToggleCollapsed?: () => void;
  onChangePriority?: (taskType: TaskType, priority: PriorityLevel) => void;
  canMoveForward: boolean;
  canMoveBackward: boolean;
}

// ... (ClickableAvatar & AvatarGroup tetap sama)

export function TaskCard({
  task,
  onMoveForward,
  onMoveBackward,
  onAssignQC,
  onRemoveQC,
  onAssignDeveloper,
  onRemoveDeveloper,
  onToggleUploaded,
  onToggleCollapsed,
  onChangePriority,
  canMoveForward,
  canMoveBackward,
}: TaskCardProps) {
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [isQCPopoverOpen, setIsQCPopoverOpen] = useState(false);
  const [isDevPopoverOpen, setIsDevPopoverOpen] = useState(false); // Tambahkan ini
  const [isPriorityPopoverOpen, setIsPriorityPopoverOpen] = useState(false);
  const [isEditingTimer, setIsEditingTimer] = useState(false);

  const isQcColumn = task.status === "QC TEST";
  const isBacklog = task.status === "BACKLOG";
  const isDone = task.status === "DONE";

  const priorityKey = `${task.taskType}-${task.priority}` as keyof typeof priorityConfig;
  const priority = priorityConfig[priorityKey];

  const assignedDevIds = new Set(task.developers.map((d) => d.id));
  const availableDevs = availableDevelopers.filter((d) => !assignedDevIds.has(d.id));

  // --- VIEW: SHRUNK/UPLOADED TETAP SAMA ---
  if (task.isCollapsed && !task.isUploaded) { /* ... kode lama ... */ }

  return (
    <div className={cn(
      "group rounded-xl border p-4 shadow-xl transition-all duration-300",
      isBacklog ? "bg-card/50 border-border" : "bg-card border-border hover:border-primary/40"
    )}>
      {/* Header & Priority */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
             <span className="text-[10px] font-black uppercase tracking-tighter text-primary/70">{task.projectName}</span>
             {task.isUploaded && <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-sm font-bold">UPLOADED</span>}
          </div>
          <h3 className="font-bold text-sm text-foreground leading-tight">{task.title}</h3>
        </div>
        
        <Popover open={isPriorityPopoverOpen} onOpenChange={setIsPriorityPopoverOpen}>
          <PopoverTrigger asChild>
            <button className={cn("rounded-md px-2 py-0.5 text-[9px] font-black uppercase border tracking-widest", priority.bgColor, priority.textColor, priority.borderColor)}>
              {priority.label}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-0">
             {/* ... content ubah prioritas ... */}
          </PopoverContent>
        </Popover>
      </div>

      {/* TIMER SECTION (REVISI) */}
      {!isBacklog && (
        <div className="mb-4 flex items-center justify-between bg-black/20 p-2 rounded-lg border border-white/5">
           <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <div className="flex flex-col">
                 <span className="text-[9px] text-muted-foreground uppercase font-bold">Work Duration</span>
                 <span className="text-xs font-mono font-bold text-white">12h 45m</span>
              </div>
           </div>
           <button 
             onClick={() => setIsEditingTimer(true)}
             className="p-1.5 hover:bg-white/10 rounded-md text-muted-foreground transition-colors"
           >
              <Pencil className="h-3 w-3" />
           </button>
        </div>
      )}

      {/* DESCRIPTION & TAGS (REVISI) */}
      <div className="mb-4">
        <button
          onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
          className="flex w-full items-center justify-between rounded-lg bg-secondary/30 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary/50 transition-all"
        >
          <div className="flex items-center gap-2">
             <Tag className="h-3 w-3" />
             <span>View Specs & Tags</span>
          </div>
          {isDescriptionOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        
        <div className={cn("overflow-hidden transition-all duration-300", isDescriptionOpen ? "max-h-96 mt-2 opacity-100" : "max-h-0 opacity-0")}>
          <div className="rounded-lg bg-black/20 p-3 space-y-3 border border-white/5">
            {/* Tags moved inside description */}
            <div className="flex flex-wrap gap-1">
               {task.tags.map(tag => (
                 <span key={tag} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold border border-primary/20">#{tag}</span>
               ))}
            </div>
            <p className="text-xs text-muted-foreground italic leading-relaxed">"{task.description}"</p>
          </div>
        </div>
      </div>

      {/* ASSIGN DEVELOPER (BACKLOG ONLY REVISI) */}
      {isBacklog && (
        <div className="mb-4 p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Assign Developers</span>
            <Popover open={isDevPopoverOpen} onOpenChange={setIsDevPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-blue-400 bg-blue-500/10 hover:bg-blue-500 hover:text-white">
                  <UserPlus className="h-3 w-3 mr-1" /> ADD
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2">
                 {availableDevs.map(dev => (
                   <button key={dev.id} onClick={() => { onAssignDeveloper?.(dev.id); setIsDevPopoverOpen(false); }} className="flex w-full items-center gap-2 p-2 hover:bg-secondary rounded-md text-sm">
                      <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-[9px] text-white", getAvatarColor(dev.id))}>{getInitials(dev.name)}</div>
                      {dev.name}
                   </button>
                 ))}
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-wrap gap-1">
            {task.developers.map(dev => (
              <div key={dev.id} className="flex items-center gap-1 bg-blue-500/20 rounded-full px-2 py-1 text-[10px] text-blue-300">
                {dev.name.split(' ')[0]}
                <X className="h-2 w-2 cursor-pointer hover:text-white" onClick={() => onRemoveDeveloper?.(dev.id)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex items-center justify-between border-t border-white/5 pt-3">
         <div className="flex -space-x-2">
            {task.developers.map(d => <ClickableAvatar key={d.id} person={d} size="sm" />)}
            {isQcColumn && task.qcAssignees.map(q => <ClickableAvatar key={q.id} person={q} size="sm" />)}
         </div>
         
         <div className="flex gap-1">
           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-white/10 hover:bg-primary hover:text-white transition-all" onClick={onMoveBackward} disabled={!canMoveBackward}>
             <ChevronLeft className="h-4 w-4" />
           </Button>
           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-white/10 hover:bg-primary hover:text-white transition-all" onClick={onMoveForward} disabled={!canMoveForward}>
             <ChevronRight className="h-4 w-4" />
           </Button>
         </div>
      </div>
    </div>
  );
}
