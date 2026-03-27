"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Code2,
  LayoutDashboard,
  LogIn,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type Person,
  allUsers,
  getInitials,
  getAvatarColor,
} from "@/lib/kanban-types";

export default function LoginPage() {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<Person | null>(null);
  const [filterRole, setFilterRole] = useState<"all" | "developer" | "qc">(
    "all"
  );

  const developers = allUsers.filter((u) => u.role === "developer");
  const qcEngineers = allUsers.filter((u) => u.role === "qc");

  const filteredUsers =
    filterRole === "all"
      ? allUsers
      : filterRole === "developer"
        ? developers
        : qcEngineers;

  const handleLogin = () => {
    if (!selectedUser) return;

    // Store active user in sessionStorage
    sessionStorage.setItem("activeUser", JSON.stringify(selectedUser));
    router.push("/");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Logo & Title */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <LayoutDashboard className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Dev-QC Workflow
            </h1>
            <p className="mt-2 text-muted-foreground">
              Pilih profil untuk melanjutkan ke dashboard
            </p>
          </div>

          {/* Role Filter */}
          <div className="mb-6 flex justify-center gap-2">
            <button
              onClick={() => setFilterRole("all")}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                filterRole === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              <Users className="mr-2 inline h-4 w-4" />
              Semua ({allUsers.length})
            </button>
            <button
              onClick={() => setFilterRole("developer")}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                filterRole === "developer"
                  ? "bg-blue-500 text-white"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              <Code2 className="mr-2 inline h-4 w-4" />
              Developer ({developers.length})
            </button>
            <button
              onClick={() => setFilterRole("qc")}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                filterRole === "qc"
                  ? "bg-amber-500 text-white"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              <ShieldCheck className="mr-2 inline h-4 w-4" />
              QC ({qcEngineers.length})
            </button>
          </div>

          {/* User Grid */}
          <div className="mb-6 grid max-h-80 grid-cols-2 gap-3 overflow-y-auto rounded-xl border border-border bg-card p-4">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
                  selectedUser?.id === user.id
                    ? "border-primary bg-primary/10"
                    : "border-transparent bg-secondary/50 hover:border-border hover:bg-secondary"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white",
                    getAvatarColor(user.id)
                  )}
                >
                  {getInitials(user.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {user.name}
                  </p>
                  <p
                    className={cn(
                      "text-xs",
                      user.role === "developer"
                        ? "text-blue-400"
                        : "text-amber-400"
                    )}
                  >
                    {user.role === "developer" ? "Developer" : "QC Engineer"}
                  </p>
                </div>
                {selectedUser?.id === user.id && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <svg
                      className="h-3 w-3 text-primary-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Login Button */}
          <Button
            onClick={handleLogin}
            disabled={!selectedUser}
            className="w-full gap-2"
            size="lg"
          >
            <LogIn className="h-4 w-4" />
            Masuk sebagai {selectedUser?.name || "..."}
          </Button>
        </div>
      </div>
    </div>
  );
}
