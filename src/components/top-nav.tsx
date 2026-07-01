import { useEffect, useRef, useState } from "react";
import { Zap, Sun, Moon, BookOpen, GitFork, User, Building2, ChevronDown, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StatINRot {
  label: string;
  connected: boolean;
}

interface HealthStat {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

type AppMode = "consumer" | "company";

// The switcher only ever renders id/name/paymentHandle — it doesn't care
// whether the underlying entity is a consumer NavAccount or a NavCompany.
export interface NavSwitcherItem {
  id: string;
  name: string;
  paymentHandle: string;
}

interface TopNavProps {
  navAccounts: NavSwitcherItem[];
  selectedNavAccountId: string;
  onNavAccountSelect: (id: string) => void;
  statuses: StatINRot[];
  healthStats: HealthStat[];
  theme: "light" | "dark";
  onThemeToggle: () => void;
  onOpenReadme: () => void;
  onOpenArchitecture: () => void;
  appMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onLogout: () => void;
}

function NavAccountSwitcher({
  navAccounts,
  selectedNavAccountId,
  onSelect,
}: {
  navAccounts: NavSwitcherItem[];
  selectedNavAccountId: string;
  onSelect: (id: string) => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const visible = navAccounts.slice(0, 2);
  const more = navAccounts.slice(2);

  return (
    <div className="flex items-center gap-1">
      {visible.map((account) => (
        <button
          key={account.id}
          type="button"
          onClick={() => onSelect(account.id)}
          className={cn(
            "px-2.5 py-0.5 rounded text-xs font-medium transition-colors max-w-[110px] truncate",
            selectedNavAccountId === account.id
              ? "bg-primary/15 text-primary border border-primary/30"
              : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent"
          )}
          title={account.name}
        >
          {account.name}
        </button>
      ))}

      {more.length > 0 && (
        <div ref={moreRef} className="relative">
          <button
            type="button"
            onClick={() => setMoreOpen((prev) => !prev)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium transition-colors border border-transparent",
              more.some((a) => a.id === selectedNavAccountId)
                ? "bg-primary/15 text-primary border-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            More
            <ChevronDown className={cn("size-3 transition-transform", moreOpen && "rotate-180")} />
          </button>

          {moreOpen && (
            <div className="absolute top-full mt-1 left-0 z-50 min-w-[160px] rounded-lg border border-border bg-card shadow-lg py-1">
              {more.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => {
                    onSelect(account.id);
                    setMoreOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-xs transition-colors truncate",
                    selectedNavAccountId === account.id
                      ? "text-primary bg-primary/10"
                      : "text-foreground hover:bg-accent"
                  )}
                  title={account.name}
                >
                  {account.name}
                  <span className="ml-1.5 text-[10px] text-muted-foreground font-mono">
                    {account.paymentHandle}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TopNav({
  navAccounts,
  selectedNavAccountId,
  onNavAccountSelect,
  statuses,
  healthStats,
  theme,
  onThemeToggle,
  onOpenReadme,
  onOpenArchitecture,
  appMode,
  onModeChange,
  onLogout,
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

      {/* Nav account switcher — controls the right panel */}
      {navAccounts.length > 0 && (
        <>
          <div className="w-px h-5 bg-border shrink-0" />
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground hidden sm:block">View:</span>
            <NavAccountSwitcher
              navAccounts={navAccounts}
              selectedNavAccountId={selectedNavAccountId}
              onSelect={onNavAccountSelect}
            />
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

        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="h-7 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-destructive"
          aria-label="Log out"
        >
          <LogOut className="size-3.5" />
          <span className="hidden sm:block">Logout</span>
        </Button>
      </div>
    </header>
  );
}
