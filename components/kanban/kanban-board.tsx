"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownAZ, Calendar, LogOut, User, Maximize2, Minimize2, Loader2 } from "lucide-react";
import { KanbanColumn } from "./kanban-column";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase"; // Pastikan path ini benar sesuai file yang kamu buat di No. 4
import type { Task, TaskStatus, TaskType, PriorityLevel, Person } from "@/lib/kanban-types";
import { availableQCers, availableDevelopers } from "@/lib/kanban-types";

const STATUSES: TaskStatus[] = ["BACKLOG", "DEVELOPMENT", "QC TEST", "DONE"];

type SortOption = "date" | "name";

export function KanbanBoard() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [activeUser, setActiveUser] = useState<Person | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch data dari Supabase saat load
  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*");
    
    if (error) {
      console.error("Error fetching tasks:", error);
    } else {
      // Mapping data dari DB ke interface Task jika diperlukan
      setTasks(data || []);
    }
  }, []);

  // 2. Cek Login & Initial Fetch
  useEffect(() => {
    const storedUser = sessionStorage.getItem("activeUser");
    if (storedUser) {
      setActiveUser(JSON.parse(storedUser));
      fetchTasks().then(() => setIsLoading(false));
    } else {
      router.push("/login");
    }
  }, [router, fetchTasks]);

  // 3. Fungsi Helper untuk update data ke Supabase (Persistance)
  const updateTaskInSupabase = async (taskId: string, updates: Partial<Task>) => {
    const { error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId);
    
    if (error) {
      console.error("Gagal update data ke database:", error);
      alert("Gagal menyimpan perubahan ke database");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("activeUser");
    router.push("/login");
  };

  const moveTask = async (taskId: string, direction: "forward" | "backward") => {
    if (!activeUser) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const currentIndex = STATUSES.indexOf(task.status);
    const newIndex = direction === "forward" ? currentIndex + 1 : currentIndex - 1;

    if (newIndex < 0 || newIndex >= STATUSES.length) return;

    const newStatus = STATUSES[newIndex];
    const timestamp = new Date().toISOString();
    const newAuditTrail = [
      ...task.auditTrail,
      { action: `Moved to ${newStatus}`, by: activeUser.name, timestamp },
    ];

    const updates = {
      status: newStatus,
      movedDate: new Date().toISOString().split("T")[0],
      auditTrail: newAuditTrail,
    };

    // Update Local State (Optimistic Update)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    
    // Update Supabase
    await updateTaskInSupabase(taskId, updates);
  };

  const assignQC = async (taskId: string, qcId: string) => {
    const qc = availableQCers.find((q) => q.id === qcId);
    const task = tasks.find((t) => t.id === taskId);
    if (!qc || !activeUser || !task) return;
    if (task.qcAssignees.some((q) => q.id === qcId)) return;

    const updates = {
      qcAssignees: [...task.qcAssignees, qc],
      auditTrail: [
        ...task.auditTrail,
        { action: `Assigned QC: ${qc.name}`, by: activeUser.name, timestamp: new Date().toISOString() },
      ],
    };

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    await updateTaskInSupabase(taskId, updates);
  };

  const assignDeveloper = async (taskId: string, devId: string) => {
    const dev = availableDevelopers.find((d) => d.id === devId);
    const task = tasks.find((t) => t.id === taskId);
    if (!dev || !activeUser || !task) return;
    if (task.developers.some((d) => d.id === devId)) return;

    const updates = {
      developers: [...task.developers, dev],
      auditTrail: [
        ...task.auditTrail,
        { action: `Assigned Developer: ${dev.name}`, by: activeUser.name, timestamp: new Date().toISOString() },
      ],
    };

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    await updateTaskInSupabase(taskId, updates);
  };

  const toggleUploaded = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!activeUser || !task) return;

    const newUploaded = !task.isUploaded;
    const updates = {
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

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    await updateTaskInSupabase(taskId, updates);
  };

  const changePriority = async (taskId: string, taskType: TaskType, priority: PriorityLevel) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!activeUser || !task) return;

    const updates = {
      taskType,
      priority,
      auditTrail: [
        ...task.auditTrail,
        { action: `Changed priority to ${taskType}-${priority}`, by: activeUser.name, timestamp: new Date().toISOString() },
      ],
    };

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    await updateTaskInSupabase(taskId, updates);
  };

  // UI Only States (No need to update DB for everything)
  const toggleCollapsed = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCollapsed: !t.isCollapsed } : t));
  };

  const sortTasks = (tasksToSort: Task[]): Task[] => {
    return [...tasksToSort].sort((a, b) => {
      if (sortBy === "date") {
        const dateA = a.status === "BACKLOG" ? a.receivedDate : a.movedDate || a.receivedDate;
        const dateB = b.status === "BACKLOG" ? b.receivedDate : b.movedDate || b.receivedDate;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      } else {
        return a.title.localeCompare(b.title);
      }
    });
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return sortTasks(tasks.filter((task) => task.status === status));
  };

  const taskCounts = useMemo(() => {
    return STATUSES.reduce((acc, status) => {
      acc[status] = tasks.filter((t) => t.status === status).length;
      return acc;
    }, {} as Record<TaskStatus, number>);
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Menghubungkan ke Supabase...</p>
      </div>
    );
  }

  if (!activeUser) return null;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Kontrol Atas */}
      <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-6 py-3">
        <h1 className="text-xl font-semibold text-foreground">Live Workflow</h1>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">Sort:</span>
            <div className="flex rounded-lg border border-border bg-card overflow-hidden">
              <button onClick={() => setSortBy("date")} className={`flex items-center gap-2 px-3 py-1.5 ${sortBy === "date" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
                <Calendar className="h-4 w-4" /> Date
              </button>
              <button onClick={() => setSortBy("name")} className={`flex items-center gap-2 px-3 py-1.5 ${sortBy === "name" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
                <ArrowDownAZ className="h-4 w-4" /> Name
              </button>
            </div>
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-card border border-border px-3 py-1.5 text-sm">
              <User className="h-4 w-4" />
              <span>{activeUser.name}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-4 border-b border-border bg-secondary/20 px-6 py-2 text-xs">
        <span className="text-muted-foreground italic">Supabase Connected: {tasks.length} tasks total</span>
        {STATUSES.map((status) => (
          <span key={status} className="font-medium">
            {status}: {taskCounts[status]}
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
            onRemoveQC={() => {}} // Tambahkan logic jika perlu
            onAssignDeveloper={assignDeveloper}
            onRemoveDeveloper={() => {}} // Tambahkan logic jika perlu
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
