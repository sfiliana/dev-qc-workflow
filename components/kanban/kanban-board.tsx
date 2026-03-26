"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownAZ, Calendar, LogOut, User, Maximize2, Minimize2, LayoutDashboard } from "lucide-react";
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
    setTasks((prevTasks) => prevTasks.map((task) => ({ ...task, isCollapsed: false })));
  };

  const shrinkAllCards = () => {
    setTasks((prevTasks) => prevTasks.map((task) => ({ ...task, isCollapsed: true })));
  };

  // --- LOGIKA MOVE, ASSIGN, DLL TETAP SAMA SEPERTI KODE KAMU ---
  // (Pastikan fungsi moveTask, assignQC, assignDeveloper tetap ada di bawah sini)
  
  const moveTask = (taskId: string, direction: "forward" | "backward") => {
    if (!activeUser) return;
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id !== taskId) return task;
        const currentIndex = STATUSES.indexOf(task.status);
        const newIndex = direction === "forward" ? currentIndex + 1 : currentIndex - 1;
        if (newIndex < 0 || newIndex >= STATUSES.length) return task;
        const newStatus = STATUSES[newIndex];
        return {
          ...task,
          status: newStatus,
          movedDate: new Date().toISOString().split("T")[0],
          auditTrail: [...task.auditTrail, { 
            action: `Moved to ${newStatus}`, 
            by: activeUser.name, 
            timestamp: new Date().toISOString() 
          }],
        };
      })
    );
  };

  const assignDeveloper = (taskId: string, devId: string) => {
    const dev = availableDevelopers.find((d) => d.id === devId);
    if (!dev || !activeUser) return;
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id !== taskId || task.developers.some((d) => d.id === devId)) return task;
        return {
          ...task,
          developers: [...task.developers, dev],
          auditTrail: [...task.auditTrail, { action: `Assigned Dev: ${dev.name}`, by: activeUser.name, timestamp: new Date().toISOString() }],
        };
      })
    );
  };

  // --- SORTING LOGIC ---
  const sortTasks = (tasksToSort: Task[]): Task[] => {
    return [...tasksToSort].sort((a, b) => {
      if (sortBy === "date") {
        const dateA = a.status === "BACKLOG" ? a.receivedDate : (a.movedDate || a.receivedDate);
        const dateB = b.status === "BACKLOG" ? b.receivedDate : (b.movedDate || b.receivedDate);
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      }
      return a.title.localeCompare(b.title);
    });
  };

  const getTasksByStatus = (status: TaskStatus) => sortTasks(tasks.filter((t) => t.status === status));

  if (isLoading || !activeUser) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#0a0a0a]">
      {/* HEADER REVISI: Sejajar & Rapi */}
      <div className="flex items-center justify-between border-b border-white/5 bg-black/40 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="bg-primary/20 p-2 rounded-lg">
            <LayoutDashboard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Dev-QC Workflow</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Management Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Controls Group */}
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
            <div className="flex items-center gap-1 px-2 border-r border-white/10 mr-1">
               <Button variant="ghost" size="sm" onClick={() => setSortBy("date")} className={sortBy === 'date' ? "bg-primary text-white" : ""}>Date</Button>
               <Button variant="ghost" size="sm" onClick={() => setSortBy("name")} className={sortBy === 'name' ? "bg-primary text-white" : ""}>Name</Button>
            </div>
            <Button variant="ghost" size="sm" onClick={expandAllCards} className="h-8 gap-1"><Maximize2 className="h-3 w-3" /> Expand All</Button>
            <Button variant="ghost" size="sm" onClick={shrinkAllCards} className="h-8 gap-1"><Minimize2 className="h-3 w-3" /> Shrink All</Button>
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-3 pl-4 border-l border-white/10">
            <div className="text-right">
              <p className="text-sm font-bold text-white leading-none">{activeUser.name}</p>
              <p className="text-[10px] text-primary uppercase font-black">{activeUser.role}</p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleLogout} className="h-8 gap-2 font-bold bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20">
              <LogOut className="h-3 w-3" /> LOGOUT
            </Button>
          </div>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="flex min-h-0 flex-1 gap-6 overflow-x-auto p-6 scrollbar-hide">
        {STATUSES.map((status, index) => (
          <KanbanColumn
            key={status}
            title={status}
            tasks={getTasksByStatus(status)}
            onMoveTask={moveTask}
            onAssignDeveloper={assignDeveloper} // Pastikan ini dipassing!
            onAssignQC={assignQC}
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
