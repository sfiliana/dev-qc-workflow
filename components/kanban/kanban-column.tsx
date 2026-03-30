"use client";

import { cn } from "@/lib/utils";
import type { Task, TaskStatus, TaskType, PriorityLevel } from "@/lib/kanban-types";
import { TaskCard } from "./task-card";

interface KanbanColumnProps {
  title: TaskStatus;
  tasks: Task[];
  onMoveTask: (taskId: string, direction: "forward" | "backward") => void;
  onAssignQC: (taskId: string, qcId: string) => void;
  onRemoveQC: (taskId: string, qcId: string) => void;
  onAssignDeveloper: (taskId: string, devId: string) => void; // Tambahan
  onRemoveDeveloper: (taskId: string, devId: string) => void; // Tambahan
  onToggleUploaded: (taskId: string) => void;
  onToggleCollapsed: (taskId: string) => void;
  onChangePriority: (taskId: string, taskType: TaskType, priority: PriorityLevel) => void;
  statusIndex: number;
  totalStatuses: number;
}

const columnStyles: Record<
  TaskStatus,
  { dot: string; border: string; bg: string }
> = {
  BACKLOG: {
    dot: "bg-slate-400",
    border: "border-t-slate-400",
    bg: "bg-slate-400/5",
  },
  DEVELOPMENT: {
    dot: "bg-blue-400",
    border: "border-t-blue-400",
    bg: "bg-blue-400/5",
  },
  "QC TEST": {
    dot: "bg-amber-400",
    border: "border-t-amber-400",
    bg: "bg-amber-400/5",
  },
  DONE: {
    dot: "bg-emerald-400",
    border: "border-t-emerald-400",
    bg: "bg-emerald-400/5",
  },
};

const columnDescriptions: Record<TaskStatus, string> = {
  BACKLOG: "Tasks yang menunggu dikerjakan",
  DEVELOPMENT: "Dalam proses pengembangan",
  "QC TEST": "Sedang diuji oleh tim QC",
  DONE: "Selesai dan terverifikasi",
};

export function KanbanColumn({
  title,
  tasks,
  onMoveTask,
  onAssignQC,
  onRemoveQC,
  onAssignDeveloper,
  onRemoveDeveloper,
  onToggleUploaded,
  onToggleCollapsed,
  onChangePriority,
  statusIndex,
  totalStatuses,
}: KanbanColumnProps) {
  const style = columnStyles[title];
  const canMoveForward = statusIndex < totalStatuses - 1;
  const canMoveBackward = statusIndex > 0;

  return (
    <div
      className={cn(
        "flex min-w-[320px] flex-1 flex-col rounded-xl",
        style.bg
      )}
    >
      <div
        className={cn(
          "mb-4 flex flex-col gap-1 rounded-t-xl border border-border bg-secondary/50 px-4 py-3 border-t-2",
          style.border
        )}
      >
        <div className="flex items-center gap-3">
          <span className={cn("h-2.5 w-2.5 rounded-full", style.dot)} />
          <h2 className="font-semibold text-foreground tracking-wide">
            {title}
          </h2>
          <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
            {tasks.length}
          </span>
        </div>
        <p className="text-xs text-muted-foreground pl-5">
          {columnDescriptions[title]}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-2 pb-4">
        {tasks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border bg-secondary/20 p-6 mx-2">
            <p className="text-sm text-muted-foreground">Tidak ada tugas</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              canMoveForward={canMoveForward}
              canMoveBackward={canMoveBackward}
              onMoveForward={() => onMoveTask(task.id, "forward")}
              onMoveBackward={() => onMoveTask(task.id, "backward")}
              onAssignQC={(qcId) => onAssignQC(task.id, qcId)}
              onRemoveQC={(qcId) => onRemoveQC(task.id, qcId)}
              onAssignDeveloper={(devId) => onAssignDeveloper(task.id, devId)}
              onRemoveDeveloper={(devId) => onRemoveDeveloper(task.id, devId)}
              onToggleUploaded={() => onToggleUploaded(task.id)}
              onToggleCollapsed={() => onToggleCollapsed(task.id)}
              onChangePriority={(taskType, priority) => onChangePriority(task.id, taskType, priority)}
            />
          ))
        )}
      </div>
    </div>
  );
}
