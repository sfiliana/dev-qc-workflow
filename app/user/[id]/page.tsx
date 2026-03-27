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

// Timer Component
function TaskTimer({ taskId }: { taskId: string }) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    // Load saved timer from sessionStorage
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
    setSeconds(0);
    setIsRunning(false);
    sessionStorage.removeItem(`timer-${taskId}`);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2">
      <Timer className="h-4 w-4 text-muted-foreground" />
      <span className="font-mono text-sm text-foreground min-w-[70px]">
        {formatTime(seconds)}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={cn(
            "rounded-md p-1 transition-colors",
            isRunning
              ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
              : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
          )}
          title={isRunning ? "Pause" : "Start"}
        >
          {isRunning ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          onClick={handleReset}
          className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          title="Reset"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function UserTaskCard({
  task,
  onToggleUploaded,
  onToggleCollapsed,
}: {
  task: Task;
  onToggleUploaded: () => void;
  onToggleCollapsed: () => void;
}) {
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const priorityKey =
    `${task.taskType}-${task.priority}` as keyof typeof priorityConfig;
  const priority = priorityConfig[priorityKey];
  const statusStyle = statusColors[task.status];
  const isBacklog = task.status === "BACKLOG";
  const isDone = task.status === "DONE";

  // Collapsed view
  if (task.isCollapsed && !task.isUploaded) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-lg transition-all hover:border-primary/30">
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
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 shadow-lg transition-all">
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
          <span className="text-[10px] text-emerald-400/70 px-2 py-0.5 rounded-full bg-emerald-500/20">
            Uploaded
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-lg transition-all hover:border-primary/30">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-muted-foreground mb-1">
            {task.projectName}
          </p>
          <h3 className="font-medium text-card-foreground leading-snug text-balance">
            {task.title}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap",
              statusStyle.bg,
              statusStyle.text,
              statusStyle.border
            )}
          >
            {task.status}
          </span>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap",
              priority.bgColor,
              priority.textColor,
              priority.borderColor
            )}
          >
            {priority.label}
          </span>
          <button
            onClick={onToggleCollapsed}
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title="Shrink card"
          >
            <Minimize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Timer */}
      <div className="mb-3">
        <TaskTimer taskId={task.id} />
      </div>

      {/* Date */}
      <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Calendar className="h-3 w-3" />
        <span>
          {isBacklog
            ? `Received: ${formatDate(task.receivedDate)}`
            : `Moved: ${formatDate(task.movedDate || task.receivedDate)}`}
        </span>
      </div>

      {/* Collapsible Description */}
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
      <div className="flex flex-wrap gap-1.5 mb-3">
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

      {/* Footer with Upload checkbox for DONE tasks */}
      {isDone && (
        <div className="border-t border-border pt-3">
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
                onToggleUploaded();
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
              Mark as Uploaded
            </span>
          </label>
        </div>
      )}
    </div>
  );
}

export default function UserTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const user = allUsers.find((u) => u.id === id);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeUser, setActiveUser] = useState<Person | null>(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("activeUser");
    if (storedUser) {
      setActiveUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("activeUser");
    router.push("/login");
  };

  const toggleUploaded = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          isUploaded: !task.isUploaded,
        };
      })
    );
  };

  const toggleCollapsed = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          isCollapsed: !task.isCollapsed,
        };
      })
    );
  };

  const userTasks = useMemo(() => {
    if (!user) return [];

    return tasks.filter((task) => {
      if (user.role === "developer") {
        return task.developers.some((dev) => dev.id === id);
      } else {
        return task.qcAssignees.some((qc) => qc.id === id);
      }
    });
  }, [user, id, tasks]);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      BACKLOG: [],
      DEVELOPMENT: [],
      "QC TEST": [],
      DONE: [],
    };

    userTasks.forEach((task) => {
      grouped[task.status].push(task);
    });

    return grouped;
  }, [userTasks]);

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            User tidak ditemukan
          </h1>
          <p className="text-muted-foreground mb-4">
            User dengan ID tersebut tidak ada dalam sistem.
          </p>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white",
                  getAvatarColor(user.id)
                )}
              >
                {getInitials(user.name)}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  {user.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  {user.role === "developer" ? (
                    <Code2 className="h-4 w-4 text-blue-400" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 text-amber-400" />
                  )}
                  <span
                    className={cn(
                      "text-sm font-medium",
                      user.role === "developer"
                        ? "text-blue-400"
                        : "text-amber-400"
                    )}
                  >
                    {user.role === "developer" ? "Developer" : "QC Engineer"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Logged in user info & Logout */}
          {activeUser && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-secondary border border-border px-3 py-1.5">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">
                  {activeUser.name}
                </span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    activeUser.role === "developer"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {activeUser.role === "developer" ? "Dev" : "QC"}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Stats */}
      <div className="border-b border-border bg-secondary/30 px-6 py-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Total Tasks:{" "}
              <span className="font-semibold text-foreground">
                {userTasks.length}
              </span>
            </span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-4">
            {(Object.keys(tasksByStatus) as TaskStatus[]).map((status) => {
              const count = tasksByStatus[status].length;
              if (count === 0) return null;
              const style = statusColors[status];
              return (
                <span
                  key={status}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-xs font-medium",
                    style.bg,
                    style.text,
                    style.border
                  )}
                >
                  {status}: {count}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Task List */}
      <main className="p-6">
        {userTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h2 className="text-lg font-medium text-foreground mb-1">
              Tidak ada tugas
            </h2>
            <p className="text-sm text-muted-foreground">
              User ini belum memiliki tugas yang ditugaskan.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {(Object.keys(tasksByStatus) as TaskStatus[]).map((status) => {
              const statusTasks = tasksByStatus[status];
              if (statusTasks.length === 0) return null;

              const style = statusColors[status];

              return (
                <section key={status}>
                  <div className="mb-4 flex items-center gap-3">
                    <span
                      className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        status === "BACKLOG" && "bg-slate-400",
                        status === "DEVELOPMENT" && "bg-blue-400",
                        status === "QC TEST" && "bg-amber-400",
                        status === "DONE" && "bg-emerald-400"
                      )}
                    />
                    <h2 className="text-lg font-semibold text-foreground">
                      {status}
                    </h2>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        style.bg,
                        style.text
                      )}
                    >
                      {statusTasks.length}
                    </span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {statusTasks.map((task) => (
                      <UserTaskCard
                        key={task.id}
                        task={task}
                        onToggleUploaded={() => toggleUploaded(task.id)}
                        onToggleCollapsed={() => toggleCollapsed(task.id)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
