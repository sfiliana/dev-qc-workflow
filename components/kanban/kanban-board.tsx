"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownAZ, Calendar, LogOut, User, Maximize2, Minimize2 } from "lucide-react";
import { KanbanColumn } from "./kanban-column";
import { Button } from "@/components/ui/button";
import type { Task, TaskStatus, TaskType, PriorityLevel, Person } from "@/lib/kanban-types";
import { availableQCers, availableDevelopers } from "@/lib/kanban-types";
import { initialTasks } from "@/lib/kanban-store";

const STATUSES: TaskStatus[] = ["BACKLOG", "DEVELOPMENT", "QC TEST", "DONE"];

type SortOption = "date" | "name";

export function KanbanBoard() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [activeUser, setActiveUser] = useState<Person | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for logged in user
  useEffect(() => {
    const storedUser = sessionStorage.getItem("activeUser");
    if (storedUser) {
      setActiveUser(JSON.parse(storedUser));
    } else {
      router.push("/login");
    }
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem("activeUser");
    router.push("/login");
  };

  const expandAllCards = () => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => ({
        ...task,
        isCollapsed: false,
      }))
    );
  };

  const shrinkAllCards = () => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => ({
        ...task,
        isCollapsed: true,
      }))
    );
  };

  const moveTask = (taskId: string, direction: "forward" | "backward") => {
    if (!activeUser) return;

    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id !== taskId) return task;

        const currentIndex = STATUSES.indexOf(task.status);
        const newIndex =
          direction === "forward" ? currentIndex + 1 : currentIndex - 1;

        if (newIndex < 0 || newIndex >= STATUSES.length) return task;

        const newStatus = STATUSES[newIndex];
        const timestamp = new Date().toISOString();

        return {
          ...task,
          status: newStatus,
          movedDate: new Date().toISOString().split("T")[0],
          auditTrail: [
            ...task.auditTrail,
            {
              action: `Moved to ${newStatus}`,
              by: activeUser.name,
              timestamp,
            },
          ],
        };
      })
    );
  };

  const assignQC = (taskId: string, qcId: string) => {
    const qc = availableQCers.find((q) => q.id === qcId);
    if (!qc || !activeUser) return;

    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id !== taskId) return task;
        if (task.qcAssignees.some((q) => q.id === qcId)) return task;

        return {
          ...task,
          qcAssignees: [...task.qcAssignees, qc],
          auditTrail: [
            ...task.auditTrail,
            {
              action: `Assigned QC: ${qc.name}`,
              by: activeUser.name,
              timestamp: new Date().toISOString(),
            },
          ],
        };
      })
    );
  };

  const removeQC = (taskId: string, qcId: string) => {
    if (!activeUser) return;

    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id !== taskId) return task;

        const removedQC = task.qcAssignees.find((qc) => qc.id === qcId);

        return {
          ...task,
          qcAssignees: task.qcAssignees.filter((qc) => qc.id !== qcId),
          auditTrail: removedQC
            ? [
                ...task.auditTrail,
                {
                  action: `Removed QC: ${removedQC.name}`,
                  by: activeUser.name,
                  timestamp: new Date().toISOString(),
                },
              ]
            : task.auditTrail,
        };
      })
    );
  };

  const assignDeveloper = (taskId: string, devId: string) => {
    const dev = availableDevelopers.find((d) => d.id === devId);
    if (!dev || !activeUser) return;

    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id !== taskId) return task;
        if (task.developers.some((d) => d.id === devId)) return task;

        return {
          ...task,
          developers: [...task.developers, dev],
          auditTrail: [
            ...task.auditTrail,
            {
              action: `Assigned Developer: ${dev.name}`,
              by: activeUser.name,
              timestamp: new Date().toISOString(),
            },
          ],
        };
      })
    );
  };

  const removeDeveloper = (taskId: string, devId: string) => {
    if (!activeUser) return;

    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id !== taskId) return task;

        const removedDev = task.developers.find((dev) => dev.id === devId);

        return {
          ...task,
          developers: task.developers.filter((dev) => dev.id !== devId),
          auditTrail: removedDev
            ? [
                ...task.auditTrail,
                {
                  action: `Removed Developer: ${removedDev.name}`,
                  by: activeUser.name,
                  timestamp: new Date().toISOString(),
                },
              ]
            : task.auditTrail,
        };
      })
    );
  };

  const toggleUploaded = (taskId: string) => {
    if (!activeUser) return;

    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id !== taskId) return task;

        const newUploaded = !task.isUploaded;

        return {
          ...task,
          isUploaded: newUploaded,
          auditTrail: [
            ...task.auditTrail,
            {
              action: newUploaded ? "Marked as Uploaded" : "Unmarked as Uploaded",
              by: activeUser.name,
              timestamp: new Date().toISOString(),
            },
          ],
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

  const changePriority = (taskId: string, taskType: TaskType, priority: PriorityLevel) => {
    if (!activeUser) return;

    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id !== taskId) return task;

        return {
          ...task,
          taskType,
          priority,
          auditTrail: [
            ...task.auditTrail,
            {
              action: `Changed priority to ${taskType}-${priority}`,
              by: activeUser.name,
              timestamp: new Date().toISOString(),
            },
          ],
        };
      })
    );
  };

  const sortTasks = (tasksToSort: Task[]): Task[] => {
    return [...tasksToSort].sort((a, b) => {
      if (sortBy === "date") {
        const dateA =
          a.status === "BACKLOG"
            ? a.receivedDate
            : a.movedDate || a.receivedDate;
        const dateB =
          b.status === "BACKLOG"
            ? b.receivedDate
            : b.movedDate || b.receivedDate;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      } else {
        return a.title.localeCompare(b.title);
      }
    });
  };

  const getTasksByStatus = (status: TaskStatus) => {
    const filtered = tasks.filter((task) => task.status === status);
    return sortTasks(filtered);
  };

  const taskCounts = useMemo(() => {
    return STATUSES.reduce(
      (acc, status) => {
        acc[status] = tasks.filter((t) => t.status === status).length;
        return acc;
      },
      {} as Record<TaskStatus, number>
    );
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!activeUser) {
    return null;
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header with Title, Sort Controls & User Info */}
      <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-6 py-3">
        {/* Left side - Title */}
        <h1 className="text-xl font-semibold text-foreground">Dev-QC Workflow</h1>

        {/* Right side - Controls & User */}
        <div className="flex items-center gap-4">
          {/* Sort Controls */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <div className="flex rounded-lg border border-border bg-card overflow-hidden">
              <button
                onClick={() => setSortBy("date")}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                  sortBy === "date"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <Calendar className="h-4 w-4" />
                Date
              </button>
              <button
                onClick={() => setSortBy("name")}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                  sortBy === "name"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <ArrowDownAZ className="h-4 w-4" />
                Name (A-Z)
              </button>
            </div>
          </div>

          {/* Expand/Shrink All Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={expandAllCards}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <Maximize2 className="h-4 w-4" />
              Expand All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={shrinkAllCards}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <Minimize2 className="h-4 w-4" />
              Shrink All
            </Button>
          </div>

          {/* Separator */}
          <div className="h-6 w-px bg-border" />

          {/* User Info & Logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-card border border-border px-3 py-1.5">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">
                {activeUser.name}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                activeUser.role === "developer"
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-amber-500/20 text-amber-400"
              }`}>
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
        </div>
      </div>

      {/* Task Count Bar */}
      <div className="flex items-center gap-4 border-b border-border bg-secondary/20 px-6 py-2">
        <span className="text-sm text-muted-foreground">
          Total: <span className="font-medium text-foreground">{tasks.length}</span> tasks
        </span>
        <div className="h-4 w-px bg-border" />
        {STATUSES.map((status) => (
          <span key={status} className="text-xs text-muted-foreground">
            {status}: <span className="font-medium text-foreground">{taskCounts[status]}</span>
          </span>
        ))}
      </div>

      {/* Kanban Columns */}
      <div className="flex min-h-0 flex-1 gap-6 overflow-x-auto p-6">
        {STATUSES.map((status, index) => (
          <KanbanColumn
            key={status}
            title={status}
            tasks={getTasksByStatus(status)}
            onMoveTask={moveTask}
            onAssignQC={assignQC}
            onRemoveQC={removeQC}
            onAssignDeveloper={assignDeveloper}
            onRemoveDeveloper={removeDeveloper}
            onToggleUploaded={toggleUploaded}
            onToggleCollapsed={toggleCollapsed}
            onChangePriority={changePriority}
            statusIndex={index}
            totalStatuses={STATUSES.length}
          />
        ))}
      </div>
    </div>
  );
}
