

import { Activity, Zap, Sun, Moon, BookOpen, GitFork, User, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { User as UserType } from "@/lib/types";

interface StatusDot {
  label: string;
  connected: boolean;
}

interface HealthStat {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

type AppMode = "consumer" | "company";

interface TopNavProps {
  currentUser: UserType;
  onUserChange: (userId: string) => void;
  users: UserType[];
  statuses: StatusDot[];
  healthStats: HealthStat[];
  theme: "light" | "dark";
  onThemeToggle: () => void;
  onOpenReadme: () => void;
  onOpenArchitecture: () => void;
  appMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export function TopNav({
  currentUser,
  onUserChange,
  users,
  statuses,
  healthStats,
  theme,
  onThemeToggle,
  onOpenReadme,
  onOpenArchitecture,
  appMode,
  onModeChange,
}: TopNavProps) {
  return (
    <header className="h-12 border-b border-border bg-card flex items-center px-4 gap-3 shrink-0 z-10">
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="size-6 rounded bg-primary flex items-center justify-center">
          <Zap className="size-3.5 text-primary-foreground" fill="currentColor" />
        </div>
        <span className="font-semibold text-sm tracking-tight text-foreground">FlowPay</span>
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 h-4 font-mono border-warning/40 text-warning bg-warning/10"
        >
          SANDBOX
        </Badge>
      </div>

      <div className="w-px h-5 bg-border shrink-0" />

      {/* Consumer / Company mode toggle */}
      <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-muted shrink-0">
        <button
          type="button"
          onClick={() => onModeChange("consumer")}
          className={cn(
            "flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs font-medium transition-all",
            appMode === "consumer"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <User className="size-3" />
          Consumer
        </button>
        <button
          type="button"
          onClick={() => onModeChange("company")}
          className={cn(
            "flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs font-medium transition-all",
            appMode === "company"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Building2 className="size-3" />
          Company
        </button>
      </div>

      {/* User selector — only relevant in consumer mode */}
      {appMode === "consumer" && (
        <>
          <div className="w-px h-5 bg-border shrink-0" />
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground hidden sm:block">User:</span>
            <div className="flex items-center gap-1">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => onUserChange(u.id)}
                  className={cn(
                    "px-2.5 py-0.5 rounded text-xs font-medium transition-colors",
                    currentUser.id === u.id
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent"
                  )}
                >
                  {u.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="flex-1" />

      {/* Health stats */}
      <div className="hidden xl:flex items-center gap-5 shrink-0">
        {healthStats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-1.5">
            <span className="text-muted-foreground">{stat.icon}</span>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
            <span className="text-xs font-mono font-medium text-foreground">
              {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
            </span>
          </div>
        ))}
      </div>

      <div className="hidden xl:block w-px h-5 bg-border shrink-0" />

      {/* Service statuses */}
      <div className="hidden lg:flex items-center gap-3.5 shrink-0">
        {statuses.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span
              className={cn("size-1.5 rounded-full", s.connected ? "bg-success" : "bg-destructive")}
            />
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="hidden lg:block w-px h-5 bg-border shrink-0" />

      {/* Nav actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenReadme}
          className="h-7 px-2.5 text-xs gap-1.5"
          aria-label="Open README"
        >
          <BookOpen className="size-3.5" />
          <span className="hidden sm:block">README</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenArchitecture}
          className="h-7 px-2.5 text-xs gap-1.5"
          aria-label="Open Architecture diagram"
        >
          <GitFork className="size-3.5" />
          <span className="hidden sm:block">Architecture</span>
        </Button>

        <div className="w-px h-5 bg-border mx-0.5" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onThemeToggle}
          className="h-7 w-7 p-0"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
        </Button>
      </div>
    </header>
  );
}
