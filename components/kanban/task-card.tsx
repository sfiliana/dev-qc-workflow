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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  type Task,
  type Person,
  type TaskType,
  type PriorityLevel,
  priorityConfig,
  priorityOptions,
  availableQCers,
  availableDevelopers, // Pastikan ini diimport
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
  onAssignDeveloper?: (devId: string) => void; // Tambahan
  onRemoveDeveloper?: (devId: string) => void; // Tambahan
  onToggleUploaded?: () => void;
  onToggleCollapsed?: () => void;
  onChangePriority?: (taskType: TaskType, priority: PriorityLevel) => void;
  canMoveForward: boolean;
  canMoveBackward: boolean;
}

interface ClickableAvatarProps {
  person: Person;
  size?: "sm" | "md";
  showBorder?: boolean;
  borderColor?: string;
}

function ClickableAvatar({
  person,
  size = "md",
  showBorder = true,
  borderColor = "border-card",
}: ClickableAvatarProps) {
  const sizeClasses =
    size === "sm" ? "h-6 w-6 text-[9px]" : "h-7 w-7 text-[10px]";

  return (
    <Link
      href={`/user/${person.id}`}
      className={cn(
        "flex items-center justify-center rounded-full font-semibold text-white transition-transform hover:scale-110 hover:z-10",
        sizeClasses,
        showBorder && `border-2 ${borderColor}`,
        getAvatarColor(person.id)
      )}
      title={`${person.name} (${person.role === "developer" ? "Developer" : "QC"})`}
    >
      {getInitials(person.name)}
    </Link>
  );
}

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
  const [isDevPopoverOpen, setIsDevPopoverOpen] = useState(false);
  const [isPriorityPopoverOpen, setIsPriorityPopoverOpen] = useState(false);

  const isQcColumn = task.status === "QC TEST";
  const isBacklogOrDev = task.status === "BACKLOG" || task.status === "DEVELOPMENT";
  const isBacklog = task.status === "BACKLOG";
  const isDone = task.status === "DONE";

  const priorityKey =
    `${task.taskType}-${task.priority}` as keyof typeof priorityConfig;
  const priority = priorityConfig[priorityKey];

  // Logic untuk filter person yang belum di-assign
  const assignedQCIds = new Set(task.qcAssignees.map((qc) => qc.id));
  const availableQC = availableQCers.filter((qc) => !assignedQCIds.has(qc.id));

  const assignedDevIds = new Set(task.developers.map((d) => d.id));
  const availableDevs = availableDevelopers.filter((d) => !assignedDevIds.has(d.id));

  // Collapsed View
  if (task.isCollapsed && !task.isUploaded) {
    return (
      <div className="group rounded-lg border border-border bg-card p-3 shadow-lg transition-all hover:border-primary/50">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-muted-foreground truncate">{task.projectName}</p>
            <h3 className="text-sm font-medium text-card-foreground truncate">{task.title}</h3>
          </div>
          <button onClick={onToggleCollapsed} className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Uploaded View
  if (task.isUploaded) {
    return (
      <div className="group rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 shadow-lg transition-all">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-emerald-400/70 truncate">{task.projectName}</p>
              <h3 className="text-sm font-medium text-emerald-400 truncate">{task.title}</h3>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-emerald-400/70 px-2 py-0.5 rounded-full bg-emerald-500/20">Uploaded</span>
            {isDone && (
              <button onClick={onToggleUploaded} className="shrink-0 rounded-md p-1.5 text-emerald-400/70 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group rounded-lg border border-border bg-card p-4 shadow-lg transition-all hover:border-primary/50 hover:shadow-primary/5">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-muted-foreground mb-1">{task.projectName}</p>
          <h3 className="font-medium text-card-foreground leading-snug text-balance">{task.title}</h3>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Popover open={isPriorityPopoverOpen} onOpenChange={setIsPriorityPopoverOpen}>
            <PopoverTrigger asChild>
              <button className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium transition-all hover:opacity-80", priority.bgColor, priority.textColor, priority.borderColor)}>
                {priority.label}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" align="end" side="bottom">
              <div className="p-2 border-b border-border"><h4 className="text-xs font-medium">Ubah Prioritas</h4></div>
              <div className="p-1 max-h-48 overflow-y-auto">
                {priorityOptions.map((opt) => {
                  const key = `${opt.taskType}-${opt.priority}` as keyof typeof priorityConfig;
                  const isSelected = task.taskType === opt.taskType && task.priority === opt.priority;
                  return (
                    <button key={key} onClick={() => { onChangePriority?.(opt.taskType, opt.priority); setIsPriorityPopoverOpen(false); }}
                      className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm", isSelected ? "bg-primary/10 text-primary" : "hover:bg-secondary")}>
                      <span className={cn("h-2 w-2 rounded-full", priorityConfig[key].bgColor.replace("/20", ""))} />
                      <span className={cn("text-xs", isSelected && "font-medium")}>{priorityConfig[key].label}</span>
                      {isSelected && <Check className="ml-auto h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
          <button onClick={onToggleCollapsed} className="rounded-md p-1 text-muted-foreground hover:bg-secondary transition-colors"><Minimize2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      {/* Date */}
      <div className="mb-3 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{isBacklog ? "Received: " : "Moved: "}{formatDate(isBacklog ? task.receivedDate : (task.movedDate || task.receivedDate))}</span>
        </div>
      </div>

      {/* Description */}
      <div className="mb-3">
        <button onClick={() => setIsDescriptionOpen(!isDescriptionOpen)} className="flex w-full items-center justify-between rounded-md bg-secondary/50 px-3 py-2 text-sm text-muted-foreground hover:bg-secondary transition-colors">
          <span>Deskripsi</span>
          {isDescriptionOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {isDescriptionOpen && (
          <div className="mt-2 rounded-md bg-secondary/30 px-3 py-2 space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>
            {task.auditTrail.length > 0 && (
              <div className="border-t border-border pt-3">
                <div className="flex items-center gap-1.5 mb-2"><History className="h-3 w-3" /><span className="text-xs font-medium">Activity Log</span></div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {task.auditTrail.slice().reverse().map((entry, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px]">
                      <span className="shrink-0 text-muted-foreground/60">{formatDateTime(entry.timestamp)}</span>
                      <span className="text-muted-foreground">{entry.action}</span>
                      <span className="text-primary/80">by {entry.by}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {task.tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
            <Tag className="h-3 w-3" />{tag}
          </span>
        ))}
      </div>

      {/* DEV ASSIGNEES SECTION */}
      {isBacklogOrDev && (
        <div className="mb-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-medium text-blue-400">Dev Assignees</span>
            </div>
            <Popover open={isDevPopoverOpen} onOpenChange={setIsDevPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/20">
                  <UserPlus className="h-3 w-3 mr-1" /> Add Dev
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="end">
                <div className="p-3 border-b border-border"><h4 className="text-sm font-medium">Pilih Developer</h4></div>
                <div className="max-h-48 overflow-y-auto p-2">
                  {availableDevs.length === 0 ? (
                    <p className="text-xs text-center py-3 text-muted-foreground">Semua Developer sudah ditugaskan</p>
                  ) : (
                    availableDevs.map((dev) => (
                      <button key={dev.id} onClick={() => { onAssignDeveloper?.(dev.id); setIsDevPopoverOpen(false); }}
                        className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-secondary transition-colors">
                        <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white", getAvatarColor(dev.id))}>{getInitials(dev.name)}</div>
                        <span className="text-foreground">{dev.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          {task.developers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {task.developers.map((dev) => (
                <div key={dev.id} className="flex items-center gap-1.5 rounded-full bg-blue-500/20 pl-1 pr-2 py-1">
                  <ClickableAvatar person={dev} size="sm" borderColor="border-blue-500/30" />
                  <span className="text-xs text-blue-300">{dev.name.split(" ")[0]}</span>
                  <button onClick={() => onRemoveDeveloper?.(dev.id)} className="ml-1 rounded-full p-0.5 text-blue-400/70 hover:text-blue-300 hover:bg-blue-500/30 transition-colors"><X className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-blue-400/70 italic">Belum ada Dev yang ditugaskan</p>}
        </div>
      )}

      {/* QC ASSIGNEES SECTION */}
      {isQcColumn && (
        <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-medium text-amber-400">QC Assignees</span>
            </div>
            <Popover open={isQCPopoverOpen} onOpenChange={setIsQCPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/20">
                  <UserPlus className="h-3 w-3 mr-1" /> Add QC
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="end">
                <div className="p-3 border-b border-border"><h4 className="text-sm font-medium">Pilih QC-er</h4></div>
                <div className="max-h-48 overflow-y-auto p-2">
                  {availableQC.length === 0 ? (
                    <p className="text-xs text-center py-3 text-muted-foreground">Semua QC-er sudah ditugaskan</p>
                  ) : (
                    availableQC.map((qc) => (
                      <button key={qc.id} onClick={() => { onAssignQC?.(qc.id); setIsQCPopoverOpen(false); }}
                        className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-secondary transition-colors">
                        <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white", getAvatarColor(qc.id))}>{getInitials(qc.name)}</div>
                        <span className="text-foreground">{qc.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          {task.qcAssignees.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {task.qcAssignees.map((qc) => (
                <div key={qc.id} className="flex items-center gap-1.5 rounded-full bg-amber-500/20 pl-1 pr-2 py-1">
                  <ClickableAvatar person={qc} size="sm" borderColor="border-amber-500/30" />
                  <span className="text-xs text-amber-300">{qc.name.split(" ")[0]}</span>
                  <button onClick={() => onRemoveQC?.(qc.id)} className="ml-1 rounded-full p-0.5 text-amber-400/70 hover:text-amber-300 hover:bg-amber-500/30 transition-colors"><X className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-amber-400/70 italic">Belum ada QC yang ditugaskan</p>}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {task.developers.length} Dev {isQcColumn && `/ ${task.qcAssignees.length} QC`}
          {isDone && (
            <label className="flex items-center gap-2 cursor-pointer group/upload ml-2">
              <div onClick={(e) => { e.preventDefault(); onToggleUploaded?.(); }} className={cn("flex h-5 w-5 items-center justify-center rounded border", task.isUploaded ? "bg-emerald-500 border-emerald-500" : "border-muted-foreground/50 hover:border-emerald-500")}>
                {task.isUploaded && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className={cn(task.isUploaded ? "text-emerald-400" : "group-hover/upload:text-emerald-400")}><Upload className="h-3 w-3 inline mr-1" />Uploaded</span>
            </label>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 disabled:opacity-30" onClick={onMoveBackward} disabled={!canMoveBackward}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 disabled:opacity-30" onClick={onMoveForward} disabled={!canMoveForward}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}
