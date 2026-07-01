import type { UserType } from "@/types/user-types";
import {
  ArrowRight,
  BookOpen,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/home-select";
import type { LoginAccount, LoginCompanyUser } from "@/types/login-page-types";


export function RightPanel(props: {
  mode: UserType;
  setMode: (m: UserType) => void;
  selectedAccount: string;
  setSelectedAccount: (v: string) => void;
  selectedCompanyUser: string;
  setSelectedCompanyUser: (v: string) => void;
  canSubmit: boolean;
  onEnter: () => void;
  accountList: LoginAccount[];
  userList: LoginCompanyUser[];
  onOpenReadme: () => void;
  readmeHighlighted: boolean;
  isLoading?: boolean;
  fetchError?: string | null;
  onRetry?: () => void;
}) {
  const {
    mode,
    setMode,
    selectedAccount,
    setSelectedAccount,
    selectedCompanyUser,
    setSelectedCompanyUser,
    canSubmit,
    onEnter,
    onOpenReadme,
    accountList,
    userList,
    readmeHighlighted,
    isLoading = false,
    fetchError = null,
    onRetry,
  } = props;

  return (
    <section className="relative flex items-center justify-center px-5 py-12 sm:px-8 lg:px-14">
      <div className="w-full max-w-md animate-fade-up">
        <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-[0_30px_80px_-30px_color-mix(in_oklch,var(--brand)_30%,transparent)] backdrop-blur sm:p-8">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Welcome to FlowPay
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Choose a persona to explore the system
            </p>
          </div>

          {/* Persona toggle */}
          <div
            role="tablist"
            aria-label="Persona"
            className="relative mb-6 grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/60 p-1"
          >
            {(["ACCOUNT", "USER"] as const).map((m) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setMode(m)}
                  className={[
                    "relative z-10 h-10 rounded-lg text-sm font-medium capitalize transition-colors",
                    active
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Fetch error */}
          {fetchError && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1">{fetchError}</span>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="flex items-center gap-1 font-medium underline-offset-2 hover:underline"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </button>
              )}
            </div>
          )}

          {/* Form */}
          {mode === "ACCOUNT" ? (
            <PersonaForm
              key={"ACCOUNT"}
              label="Demo account"
              placeholder={isLoading ? "Loading…" : "Select a demo account"}
              value={selectedAccount}
              onChange={setSelectedAccount}
              disabled={isLoading}
              options={accountList.map((u) => ({
                value: u.accountID,
                label: u.accountName,
                hint: u.description,
              }))}
            />
          ) : (
            <PersonaForm
              key="USER"
              label="Demo company user"
              placeholder={isLoading ? "Loading…" : "Select a demo company user"}
              value={selectedCompanyUser}
              onChange={setSelectedCompanyUser}
              disabled={isLoading}
              showCompany
              options={userList.map((c) => ({
                value: c.accountID,
                label: c.accountName,
                companyName: c.companyName,
                role: c.description,
                hint: c.companyName,
              }))}
            />
          )}

          <p className="mt-3 flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--accent-cyan)]" />
            No password required · sandbox environment
          </p>

          <Button
            onClick={onEnter}
            disabled={!canSubmit}
            className="mt-6 h-12 w-full gap-2 bg-[color:var(--brand)] text-[color:var(--brand-foreground)] hover:bg-[color:var(--brand)]/90 disabled:opacity-50"
          >
            {mode === "ACCOUNT" ? "Enter Sandbox" : "Manage Offers"}
            <ArrowRight className="h-4 w-4" />
          </Button>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={onOpenReadme}
              data-readme-btn
              className={[
                "group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-all hover:text-foreground",
                readmeHighlighted
                  ? "relative z-[60] bg-card ring-2 ring-[color:var(--accent-cyan)] ring-offset-2 ring-offset-background"
                  : "",
              ].join(" ")}
            >
              <BookOpen className="h-3.5 w-3.5" />
              New here?{" "}
              <span className="underline-offset-4 group-hover:underline">
                Read about the project
              </span>
            </button>
          </div>
        </div>

        <p className="mt-5 text-center font-mono text-[11px] text-muted-foreground">
          intentionally not a consumer banking app · engineering demo
        </p>
      </div>
    </section>
  );
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500/15 text-red-500",
  manager: "bg-blue-500/15 text-blue-500",
  owner: "bg-purple-500/15 text-purple-500",
  viewer: "bg-emerald-500/15 text-emerald-500",
  member: "bg-orange-500/15 text-orange-500",
  finance: "bg-amber-500/15 text-amber-500",
};

function getRoleChipClass(role: string) {
  return ROLE_COLORS[role.toLowerCase()] ?? "bg-muted text-muted-foreground";
}

function PersonaForm({
  label,
  placeholder,
  value,
  onChange,
  options,
  disabled = false,
  showCompany = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; companyName?: string; role?: string; hint: string }[];
  disabled?: boolean;
  showCompany?: boolean;
}) {
  const selectedOpt = value ? options.find((o) => o.value === value) : null;
  
  return (
    <div className="animate-fade-up">
      <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <Select value={selectedOpt?.label || null} onValueChange={(v) => onChange(v ?? "")} disabled={disabled}>
        <SelectTrigger className="h-12 w-full bg-background">
          {showCompany && selectedOpt ? (
            <span className="flex min-w-0 flex-col items-start text-left leading-tight row-gap-4">
              <span className="truncate text-sm font-medium">{selectedOpt.label}</span>
              {selectedOpt.companyName && (
                <span className="truncate text-[11px] text-muted-foreground">{selectedOpt.companyName}</span>
              )}
            </span>
          ) : (
            <SelectValue placeholder={placeholder} />
          )}
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              <span className="flex min-w-0 items-center justify-between gap-2">
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{o.label}</span>
                  {showCompany && o.companyName && (
                    <span className="truncate font-mono text-[11px] text-muted-foreground">{o.companyName}</span>
                  )}
                  {!showCompany && o.hint && (
                    <span className="truncate font-mono text-[11px] text-muted-foreground">{o.hint}</span>
                  )}
                </span>
                {showCompany && o.role && (
                  <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getRoleChipClass(o.role)}`}>
                    {o.role}
                  </span>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}