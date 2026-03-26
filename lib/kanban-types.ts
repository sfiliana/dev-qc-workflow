export type TaskType = "task" | "patch";
export type PriorityLevel = "high" | "medium" | "low";
export type TaskStatus = "BACKLOG" | "DEVELOPMENT" | "QC TEST" | "DONE";
export type UserRole = "developer" | "qc";

export interface Person {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface AuditEntry {
  action: string;
  by: string;
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  projectName: string;
  description: string;
  taskType: TaskType;
  priority: PriorityLevel;
  developers: Person[];
  qcAssignees: Person[];
  tags: string[];
  status: TaskStatus;
  receivedDate: string;
  movedDate?: string;
  isUploaded?: boolean;
  isCollapsed?: boolean;
  auditTrail: AuditEntry[];
}

// Dummy QC-ers for assignment
export const availableQCers: Person[] = [
  { id: "qc1", name: "Agus Setiawan", role: "qc" },
  { id: "qc2", name: "Maya Sari", role: "qc" },
  { id: "qc3", name: "Rizky Firmansyah", role: "qc" },
  { id: "qc4", name: "Dewi Anggraini", role: "qc" },
  { id: "qc5", name: "Eko Prasetyo", role: "qc" },
];

// Dummy Developers
export const availableDevelopers: Person[] = [
  { id: "dev1", name: "Budi Santoso", role: "developer" },
  { id: "dev2", name: "Dewi Lestari", role: "developer" },
  { id: "dev3", name: "Sari Dewi", role: "developer" },
  { id: "dev4", name: "Andi Wijaya", role: "developer" },
  { id: "dev5", name: "Putri Maharani", role: "developer" },
  { id: "dev6", name: "Andi Pratama", role: "developer" },
  { id: "dev7", name: "Rini Kusuma", role: "developer" },
  { id: "dev8", name: "Fajar Nugroho", role: "developer" },
  { id: "dev9", name: "Diana Putri", role: "developer" },
  { id: "dev10", name: "Hendra Gunawan", role: "developer" },
];

// Priority badge configurations
export const priorityConfig: Record<
  `${TaskType}-${PriorityLevel}`,
  { label: string; bgColor: string; textColor: string; borderColor: string }
> = {
  "task-high": {
    label: "Task - High",
    bgColor: "bg-red-500/20",
    textColor: "text-red-400",
    borderColor: "border-red-500/30",
  },
  "task-medium": {
    label: "Task - Medium",
    bgColor: "bg-amber-500/20",
    textColor: "text-amber-400",
    borderColor: "border-amber-500/30",
  },
  "task-low": {
    label: "Task - Low",
    bgColor: "bg-blue-500/20",
    textColor: "text-blue-400",
    borderColor: "border-blue-500/30",
  },
  "patch-high": {
    label: "Patch - High",
    bgColor: "bg-rose-500/20",
    textColor: "text-rose-400",
    borderColor: "border-rose-500/30",
  },
  "patch-medium": {
    label: "Patch - Medium",
    bgColor: "bg-orange-500/20",
    textColor: "text-orange-400",
    borderColor: "border-orange-500/30",
  },
  "patch-low": {
    label: "Patch - Low",
    bgColor: "bg-cyan-500/20",
    textColor: "text-cyan-400",
    borderColor: "border-cyan-500/30",
  },
};

// Priority options for dropdown
export const priorityOptions: { taskType: TaskType; priority: PriorityLevel }[] = [
  { taskType: "task", priority: "high" },
  { taskType: "task", priority: "medium" },
  { taskType: "task", priority: "low" },
  { taskType: "patch", priority: "high" },
  { taskType: "patch", priority: "medium" },
  { taskType: "patch", priority: "low" },
];

// All users combined for profile lookup
export const allUsers: Person[] = [...availableDevelopers, ...availableQCers];

export function getUserById(id: string): Person | undefined {
  return allUsers.find((user) => user.id === id);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function formatDate(dateString: string): string {
  // Parse as UTC to avoid timezone issues between server and client
  const [year, month, day] = dateString.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

export function formatDateTime(dateString: string): string {
  // Parse ISO string and format consistently
  const date = new Date(dateString);
  const day = date.getUTCDate();
  const month = MONTHS[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

const avatarColors = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-pink-500",
];

export function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % avatarColors.length;
  return avatarColors[index];
}
