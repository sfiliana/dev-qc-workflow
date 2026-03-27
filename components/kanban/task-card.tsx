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

interface AvatarGroupProps {
  people: Person[];
  label: string;
  maxVisible?: number;
}

function AvatarGroup({ people, label, maxVisible = 4 }: AvatarGroupProps) {
  const visible = people.slice(0, maxVisible);
  const remaining = people.length - maxVisible;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}:</span>
      <div className="flex -space-x-2">
        {visible.map((person) => (
          <ClickableAvatar key={person.id} person={person} />
        ))}
        {remaining > 0 && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-semibold text-muted-foreground">
            +{remaining}
          </div>
        )}
      </div>
    </div>
  );
}

export function TaskCard({
  task,
  onMoveForward,
  onMoveBackward,
  onAssignQC,
  onRemoveQC,
  onToggleUploaded,
  onToggleCollapsed,
  onChangePriority,
  canMoveForward,
  canMoveBackward,
}: TaskCardProps) {
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [isQCPopoverOpen, setIsQCPopoverOpen] = useState(false);
  const [isPriorityPopoverOpen, setIsPriorityPopoverOpen] = useState(false);

  const isQcColumn = task.status === "QC TEST";
  const isBacklog = task.status === "BACKLOG";
  const isDone = task.status === "DONE";

  const priorityKey =
    `${task.taskType}-${task.priority}` as keyof typeof priorityConfig;
  const priority = priorityConfig[priorityKey];

  const assignedQCIds = new Set(task.qcAssignees.map((qc) => qc.id));
  const availableToAssign = availableQCers.filter(
    (qc) => !assignedQCIds.has(qc.id)
  );

  // Collapsed view - only show project name and title
  if (task.isCollapsed && !task.isUploaded) {
    return (
      <div className="group rounded-lg border border-border bg-card p-3 shadow-lg transition-all hover:border-primary/50">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-muted-foreground truncate">
              {task.projectName}
            </p>
            <h3 className="text-sm font-medium text-card-foreground truncate">
              {task.title}
            </h3>
          </div>
          <button
            onClick={onToggleCollapsed}
            className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title="Expand card"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Uploaded view - green shrunk card
  if (task.isUploaded) {
    return (
      <div className="group rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 shadow-lg transition-all">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-emerald-400/70 truncate">
                {task.projectName}
              </p>
              <h3 className="text-sm font-medium text-emerald-400 truncate">
                {task.title}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-emerald-400/70 px-2 py-0.5 rounded-full bg-emerald-500/20">
              Uploaded
            </span>
            {isDone && (
              <button
                onClick={onToggleUploaded}
                className="shrink-0 rounded-md p-1.5 text-emerald-400/70 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors"
                title="Unmark as uploaded"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full card view
  return (
    <div className="group rounded-lg border border-border bg-card p-4 shadow-lg transition-all hover:border-primary/50 hover:shadow-primary/5">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-muted-foreground mb-1">
            {task.projectName}
          </p>
          <h3 className="font-medium text-card-foreground leading-snug text-balance">
            {task.title}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Priority Badge with Popover */}
          <Popover
            open={isPriorityPopoverOpen}
            onOpenChange={setIsPriorityPopoverOpen}
          >
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap transition-all hover:opacity-80",
                  priority.bgColor,
                  priority.textColor,
                  priority.borderColor
                )}
              >
                {priority.label}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" align="end" side="bottom">
              <div className="p-2 border-b border-border">
                <h4 className="text-xs font-medium text-foreground">
                  Ubah Prioritas
                </h4>
              </div>
              <div className="p-1 max-h-48 overflow-y-auto">
                {priorityOptions.map((opt) => {
                  const key = `${opt.taskType}-${opt.priority}` as keyof typeof priorityConfig;
                  const config = priorityConfig[key];
                  const isSelected =
                    task.taskType === opt.taskType &&
                    task.priority === opt.priority;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        onChangePriority?.(opt.taskType, opt.priority);
                        setIsPriorityPopoverOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                        isSelected
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-secondary"
                      )}
                    >
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          config.bgColor.replace("/20", "")
                        )}
                      />
                      <span
                        className={cn("text-xs", isSelected && "font-medium")}
                      >
                        {config.label}
                      </span>
                      {isSelected && <Check className="ml-auto h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          {/* Collapse Button */}
          <button
            onClick={onToggleCollapsed}
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title="Shrink card"
          >
            <Minimize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Date Tracking */}
      <div className="mb-3 flex flex-col gap-1">
        {isBacklog ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Received: {formatDate(task.receivedDate)}</span>
          </div>
        ) : (
          task.movedDate && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Moved: {formatDate(task.movedDate)}</span>
            </div>
          )
        )}
      </div>

      {/* Collapsible Description with Audit Trail */}
      <div className="mb-3">
        <button
          onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
          className="flex w-full items-center justify-between rounded-md bg-secondary/50 px-3 py-2 text-left text-sm text-muted-foreground hover:bg-secondary transition-colors"
        >
          <span>Deskripsi</span>
          {isDescriptionOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        <div
          className={cn(
            "overflow-hidden transition-all duration-200",
            isDescriptionOpen ? "max-h-96 mt-2" : "max-h-0"
          )}
        >
          <div className="rounded-md bg-secondary/30 px-3 py-2 space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {task.description}
            </p>

            {/* Audit Trail */}
            {task.auditTrail.length > 0 && (
              <div className="border-t border-border pt-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <History className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Activity Log
                  </span>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {task.auditTrail
                    .slice()
                    .reverse()
                    .map((entry, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-[11px]"
                      >
                        <span className="shrink-0 text-muted-foreground/60">
                          {formatDateTime(entry.timestamp)}
                        </span>
                        <span className="text-muted-foreground">
                          {entry.action}
                        </span>
                        <span className="text-primary/80">by {entry.by}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {task.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
          >
            <Tag className="h-3 w-3" />
            {tag}
          </span>
        ))}
      </div>

      {/* Developers */}
      {task.developers.length > 0 && (
        <div className="mb-3">
          <AvatarGroup people={task.developers} label="Developers" />
        </div>
      )}

      {/* QC Assignees Section - Only show in QC TEST column */}
      {isQcColumn && (
        <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-medium text-amber-400">
                QC Assignees
              </span>
            </div>
            <Popover open={isQCPopoverOpen} onOpenChange={setIsQCPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/20"
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Add QC
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="end" side="bottom">
                <div className="p-3 border-b border-border">
                  <h4 className="text-sm font-medium text-foreground">
                    Pilih QC-er
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Klik untuk menambahkan ke task ini
                  </p>
                </div>
                <div className="max-h-48 overflow-y-auto p-2">
                  {availableToAssign.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">
                      Semua QC-er sudah ditugaskan
                    </p>
                  ) : (
                    availableToAssign.map((qc) => (
                      <button
                        key={qc.id}
                        onClick={() => {
                          onAssignQC?.(qc.id);
                          setIsQCPopoverOpen(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-secondary transition-colors"
                      >
                        <div
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white",
                            getAvatarColor(qc.id)
                          )}
                        >
                          {getInitials(qc.name)}
                        </div>
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
              {task.qcAssignees.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center gap-1.5 rounded-full bg-amber-500/20 pl-1 pr-2 py-1"
                >
                  <ClickableAvatar
                    person={person}
                    size="sm"
                    borderColor="border-amber-500/30"
                  />
                  <Link
                    href={`/user/${person.id}`}
                    className="text-xs text-amber-300 hover:text-amber-200 transition-colors"
                  >
                    {person.name.split(" ")[0]}
                  </Link>
                  <button
                    onClick={() => onRemoveQC?.(person.id)}
                    className="ml-1 rounded-full p-0.5 text-amber-400/70 hover:text-amber-300 hover:bg-amber-500/30 transition-colors"
                    title="Hapus QC"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-amber-400/70 italic">
              Belum ada QC yang ditugaskan
            </p>
          )}
        </div>
      )}

      {/* Footer with Navigation and Upload */}
      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-3">
          <div className="text-xs text-muted-foreground">
            {task.developers.length} Dev
            {isQcColumn && ` / ${task.qcAssignees.length} QC`}
          </div>

          {/* Upload checkbox - only in DONE column */}
          {isDone && (
            <label className="flex items-center gap-2 cursor-pointer group/upload">
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                  task.isUploaded
                    ? "bg-emerald-500 border-emerald-500"
                    : "border-muted-foreground/50 hover:border-emerald-500"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  onToggleUploaded?.();
                }}
              >
                {task.isUploaded && <Check className="h-3 w-3 text-white" />}
              </div>
              <span
                className={cn(
                  "text-xs transition-colors",
                  task.isUploaded
                    ? "text-emerald-400"
                    : "text-muted-foreground group-hover/upload:text-emerald-400"
                )}
              >
                <Upload className="h-3 w-3 inline mr-1" />
                Uploaded
              </span>
            </label>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30"
            onClick={onMoveBackward}
            disabled={!canMoveBackward}
            aria-label="Pindah ke kolom sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30"
            onClick={onMoveForward}
            disabled={!canMoveForward}
            aria-label="Pindah ke kolom selanjutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
