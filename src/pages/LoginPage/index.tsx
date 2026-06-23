import { useEffect, useState } from "react";
import {
  ArrowRight,
  Moon,
  Sun,
  Sparkles,
  BookOpen,
  X,
  Activity,
  Layers,
  Workflow,
  ShieldCheck,
  CircuitBoard,
  Wallet,
} from "lucide-react";
import Github from '@/assets/github.svg?react';
import Linkedin from '@/assets/linkedin.svg?react';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/home-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { UserType } from "@/lib/user-types";
import { LoadingScreen } from "@/components/login-loading-screen";
import { LogoMark } from "@/components/logo-mark";


const ARCH_FLOW = [
  "API Gateway",
  "Payment Service",
  "Kafka",
  "Offer Service",
  "Ledger Service",
  "Notification Service",
];

/* ---------------- root ---------------- */

function LoginPage() {
  const [mode, setMode] = useState<UserType>("USER");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [readmeOpen, setReadmeOpen] = useState(false);
  const [firstVisit, setFirstVisit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // theme init
  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("fp_theme")) as
      | "light"
      | "dark"
      | null;
    const initial =
      stored ??
      (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "dark");
    setTheme(initial);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("fp_theme", theme);
  }, [theme]);

  // first visit
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("fp_seen")) setFirstVisit(true);
  }, []);

  const dismissFirstVisit = (openReadme = false) => {
    localStorage.setItem("fp_seen", "1");
    setFirstVisit(false);
    if (openReadme) setReadmeOpen(true);
  };

  const canSubmit = mode === "USER" ? !!selectedUser : !!selectedCompany;

  const handleEnter = () => {
    if (!canSubmit) return;
    setLoading(true);
    setTimeout(() => setLoading(false), 2200);
  };

  return (
    <div className="relative min-h-dvh bg-background text-foreground">
      {/* Theme toggle */}
      <button
        type="button"
        aria-label="Toggle theme"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="fixed right-4 top-4 z-40 grid h-10 w-10 place-items-center rounded-full border border-border bg-card/70 backdrop-blur hover:bg-accent transition-colors"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <main className="mx-auto grid min-h-dvh w-full max-w-[1600px] grid-cols-1 lg:grid-cols-[1fr_1fr] xl:grid-cols-[1fr_1fr]">
        <LeftPanel />
        <RightPanel
          mode={mode}
          setMode={setMode}
          companyList={[]}
          userList={[]}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          selectedCompany={selectedCompany}
          setSelectedCompany={setSelectedCompany}
          canSubmit={canSubmit}
          onEnter={handleEnter}
          onOpenReadme={() => setReadmeOpen(true)}
          readmeHighlighted={firstVisit}
        />
      </main>

      <Footer />

      <ReadmeDialog open={readmeOpen} onOpenChange={setReadmeOpen} />

      {firstVisit && (
        <FirstVisitOverlay
          onOpenReadme={() => dismissFirstVisit(true)}
          onDismiss={() => dismissFirstVisit(false)}
        />
      )}

      {loading && <LoadingScreen />}
    </div>
  );
}

/* ---------------- left panel ---------------- */

function LeftPanel() {
  return (
    <section className="relative isolate flex flex-col justify-between overflow-hidden border-b border-border lg:border-b-0 lg:border-r">
      <div className="absolute inset-0 -z-10 bg-grid opacity-60" />
      <div className="absolute inset-0 -z-10 bg-radial-fade" />

      {/* Logo */}
      <header className="flex items-center gap-3 px-6 pt-6 sm:px-10 sm:pt-10">
        <LogoMark className="h-9 w-9" />
        <span className="font-display text-xl font-bold tracking-tight">
          Flow<span className="text-gradient-brand">Pay</span>
        </span>
        <span className="ml-2 hidden rounded-full border border-border bg-card/60 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:inline">
          v1.0 · sandbox
        </span>
      </header>

      <div className="relative px-6 py-10 sm:px-10 lg:py-16 xl:px-16">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground backdrop-blur">
          <span className="h-1.5 w-1.5 animate-ledger-tick rounded-full bg-[color:var(--accent-cyan)]" />
          Distributed Systems Portfolio
        </p>
        <h1 className="font-display text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
          Payments that flow.
          <br />
          <span className="text-gradient-brand">Systems that scale.</span>
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          A production-grade distributed payment platform built to demonstrate
          event-driven architecture, transactional consistency, offer engines,
          ledger systems and real-time observability.
        </p>

        <SystemIllustration />
      </div>

      <ArchPreviewCard />
    </section>
  );
}

/* ---------------- right panel ---------------- */

function RightPanel(props: {
  mode: UserType;
  setMode: (m: UserType) => void;
  selectedUser: string;
  setSelectedUser: (v: string) => void;
  selectedCompany: string;
  setSelectedCompany: (v: string) => void;
  canSubmit: boolean;
  onEnter: () => void;
  userList: any[];
  companyList: any[];
  onOpenReadme: () => void;
  readmeHighlighted: boolean;
}) {
  const {
    mode,
    setMode,
    selectedUser,
    setSelectedUser,
    selectedCompany,
    setSelectedCompany,
    canSubmit,
    onEnter,
    onOpenReadme,
    userList,
    companyList,
    readmeHighlighted,
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
            {(["USER", "COMPANY"] as const).map((m) => {
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

          {/* Form */}
          {mode === "USER" ? (
            <PersonaForm
              key="USER"
              label="Demo user"
              placeholder="Select a demo user"
              value={selectedUser}
              onChange={setSelectedUser}
              options={userList.map((u) => ({
                value: u.id,
                label: u.name,
                hint: `${u.email} · ${u.balance}`,
              }))}
            />
          ) : (
            <PersonaForm
              key="company"
              label="Demo company"
              placeholder="Select a demo company"
              value={selectedCompany}
              onChange={setSelectedCompany}
              options={companyList.map((c) => ({
                value: c.id,
                label: c.name,
                hint: `${c.offers} offers · ${c.status}`,
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
            {mode === "USER" ? "Enter Sandbox" : "Manage Offers"}
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

function PersonaForm({
  label,
  placeholder,
  value,
  onChange,
  options,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; hint: string }[];
}) {
  return (
    <div className="animate-fade-up">
      <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <Select value={value || null} onValueChange={(v) => onChange(v ?? "")}>
        <SelectTrigger className="h-12 w-full bg-background">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              <div className="flex flex-col">
                <span className="font-medium">{o.label}</span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {o.hint}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ---------------- illustration ---------------- */

function SystemIllustration() {
  return (
    <div className="relative mt-10 hidden h-56 w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card/40 backdrop-blur sm:block lg:h-64">
      {/* event stream lanes */}
      {[20, 50, 80].map((top, i) => (
        <div
          key={top}
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[color:var(--accent-cyan)]/40 to-transparent"
          style={{ top: `${top}%` }}
        >
          <span
            className="absolute -top-[3px] block h-1.5 w-10 rounded-full bg-[color:var(--accent-cyan)] animate-stream"
            style={{ animationDelay: `${i * 0.7}s` }}
          />
          <span
            className="absolute -top-[3px] block h-1.5 w-6 rounded-full bg-[color:var(--brand)] animate-stream"
            style={{ animationDelay: `${i * 0.7 + 1.4}s` }}
          />
        </div>
      ))}

      {/* nodes */}
      <Node
        icon={<Wallet className="h-4 w-4" />}
        label="wallet.a"
        className="left-[6%] top-[18%] animate-float"
        style={{ animationDelay: "0s" }}
      />
      <Node
        icon={<CircuitBoard className="h-4 w-4" />}
        label="payment.svc"
        accent
        className="left-1/2 top-[42%] -translate-x-1/2 animate-float"
        style={{ animationDelay: "1.5s" }}
      />
      <Node
        icon={<Layers className="h-4 w-4" />}
        label="ledger.blk"
        className="right-[6%] top-[18%] animate-float"
        style={{ animationDelay: "0.8s" }}
      />
      <Node
        icon={<Wallet className="h-4 w-4" />}
        label="wallet.b"
        className="right-[10%] bottom-[14%] animate-float"
        style={{ animationDelay: "2.2s" }}
      />
      <Node
        icon={<Workflow className="h-4 w-4" />}
        label="offer.svc"
        className="left-[10%] bottom-[14%] animate-float"
        style={{ animationDelay: "1.1s" }}
      />

      {/* corner badge */}
      <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur">
        <span className="h-1.5 w-1.5 animate-ledger-tick rounded-full bg-emerald-400" />
        live · 12.4k evt/s
      </div>
    </div>
  );
}

function Node({
  icon,
  label,
  className = "",
  style,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  className?: string;
  style?: React.CSSProperties;
  accent?: boolean;
}) {
  return (
    <div
      className={`absolute flex items-center gap-2 rounded-xl border border-border bg-background/80 px-2.5 py-1.5 shadow-sm backdrop-blur ${className}`}
      style={style}
    >
      <span
        className={`relative grid h-7 w-7 place-items-center rounded-md ${
          accent
            ? "bg-[color:var(--brand)] text-[color:var(--brand-foreground)]"
            : "bg-muted text-foreground"
        }`}
      >
        {icon}
        {accent && (
          <span className="absolute inset-0 rounded-md bg-[color:var(--brand)]/40 animate-pulse-ring" />
        )}
      </span>
      <span className="font-mono text-[11px] tracking-tight">{label}</span>
    </div>
  );
}

/* ---------------- arch preview card ---------------- */

function ArchPreviewCard() {
  return (
    <div className="mx-6 mb-6 hidden sm:mx-10 sm:mb-10 md:block xl:mx-16">
      <div className="rounded-xl border border-border bg-card/70 p-4 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-[color:var(--accent-cyan)]" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Architecture · request flow
            </span>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">~p99 84ms</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {ARCH_FLOW.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <span
                className={[
                  "rounded-md border px-2.5 py-1 font-mono text-[11px]",
                  i === 2
                    ? "border-[color:var(--accent-cyan)]/40 bg-[color:var(--accent-cyan)]/10 text-foreground"
                    : "border-border bg-background/60 text-foreground",
                ].join(" ")}
              >
                {step}
              </span>
              {i < ARCH_FLOW.length - 1 && (
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- footer ---------------- */

function Footer() {
  return (
    <footer className="border-t border-border bg-background/70 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-3 px-6 py-5 text-sm sm:flex-row sm:px-10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[color:var(--accent-cyan)]" />
          <span className="font-medium">Built by Sheldon</span>
          <span className="font-mono text-xs text-muted-foreground">
            © {new Date().getFullYear()} FlowPay
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="grid h-9 w-9 place-items-center rounded-full border border-border hover:bg-accent transition-colors"
          >
            <Github className="lucide lucide-react h-4 w-4" />
          </a>
          <a
            href="https://linkedin.com/"
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
            className="grid h-9 w-9 place-items-center rounded-full border border-border hover:bg-accent transition-colors"
          >
            <Linkedin className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}

/* ---------------- readme modal ---------------- */

function ReadmeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-3xl overflow-hidden p-0 sm:rounded-2xl">
        <div className="max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 z-10 border-b border-border bg-card/95 px-6 py-4 backdrop-blur sm:px-8">
            <div className="flex items-center gap-3">
              <LogoMark className="h-8 w-8" />
              <div className="text-left">
                <DialogTitle className="font-display text-xl">FlowPay — README</DialogTitle>
                <DialogDescription className="text-xs">
                  Distributed systems portfolio project
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-8 px-6 py-6 text-sm leading-relaxed sm:px-8 sm:py-8">
            <Section title="Why FlowPay was built">
              <p className="text-muted-foreground">
                FlowPay exists to demonstrate, in a tangible system, the patterns
                that production payment platforms rely on: idempotent writes,
                eventual consistency through events, double-entry ledger
                accounting, reservation/redemption flows, and end-to-end
                observability. It is the kind of project that's easier to{" "}
                <em>show</em> than to describe in a CV bullet.
              </p>
            </Section>

            <Section title="Engineering concepts demonstrated">
              <ul className="grid gap-2 text-muted-foreground sm:grid-cols-2">
                {[
                  "Event-driven architecture (Kafka)",
                  "Transactional outbox pattern",
                  "Idempotency keys & exactly-once semantics",
                  "Double-entry ledger accounting",
                  "Offer reservation / redemption flow",
                  "Saga-style distributed transactions",
                  "Asynchronous notifications",
                  "Real-time observability & metrics",
                ].map((x) => (
                  <li
                    key={x}
                    className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--accent-cyan)]" />
                    {x}
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="What it is intentionally NOT">
              <p className="text-muted-foreground">
                FlowPay is <strong>not</strong> a consumer banking application.
                There is no KYC, no card issuance, no regulatory compliance
                surface, no real funds movement. Authentication is
                persona-based for demo purposes. The goal is engineering
                pedagogy — not a fintech you'd hand to a customer.
              </p>
            </Section>

            <Section title="Technology stack">
              <div className="flex flex-wrap gap-2 font-mono text-xs">
                {[
                  "Golang",
                  "Kafka",
                  "PostgreSQL",
                  "Redis",
                  "React 19",
                  "TypeScript",
                  "Tailwind v4",
                  "Docker",
                  "Prometheus",
                  "Grafana",
                ].map((t) => (
                  <span
                    key={t}
                    className="rounded-md border border-border bg-background px-2.5 py-1"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Section>

            <Section title="Architecture overview">
              <div className="overflow-x-auto rounded-xl border border-border bg-muted/40 p-4">
                <div className="flex min-w-max items-center gap-2">
                  {ARCH_FLOW.map((s, i) => (
                    <div key={s} className="flex items-center gap-2">
                      <span className="rounded-md border border-border bg-background px-2.5 py-1 font-mono text-[11px]">
                        {s}
                      </span>
                      {i < ARCH_FLOW.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-3 text-muted-foreground">
                Requests enter through the API Gateway, are processed by the
                Payment Service which writes to its outbox, emits Kafka events
                consumed by the Offer and Ledger services, and finally trigger
                Notifications — all observable end-to-end.
              </p>
            </Section>

            <Section title="Links">
              <div className="flex flex-wrap gap-2">
                <a
                  href="https://github.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-accent"
                >
                  <Github className="lucide lucide-react h-4 w-4" /> GitHub repository
                </a>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-accent"
                >
                  <BookOpen className="h-4 w-4" /> Architecture docs
                </a>
              </div>
            </Section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 font-display text-base font-semibold tracking-tight">
        {title}
      </h3>
      {children}
    </section>
  );
}

/* ---------------- first-visit overlay ---------------- */

function FirstVisitOverlay({
  onOpenReadme,
  onDismiss,
}: {
  onOpenReadme: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 animate-fade-up bg-black/70 backdrop-blur-sm">
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="absolute inset-x-0 bottom-10 mx-0 max-w-md px-5 sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:px-0">
        <div className="rounded-2xl border border-white/10 bg-card p-6 text-card-foreground shadow-2xl glow-brand">
          <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-[color:var(--accent-cyan)]" />
            Start here
          </div>
          <h3 className="font-display text-xl font-semibold tracking-tight">
            This project showcases distributed systems concepts
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            FlowPay demonstrates payment infrastructure patterns rather than
            consumer banking features. The README explains the why and the how.
          </p>
          <div className="mt-5 flex gap-2">
            <Button
              onClick={onOpenReadme}
              className="h-11 flex-1 gap-2 bg-[color:var(--brand)] text-[color:var(--brand-foreground)] hover:bg-[color:var(--brand)]/90"
            >
              <BookOpen className="h-4 w-4" /> Open README
            </Button>
            <Button
              onClick={onDismiss}
              variant="outline"
              className="h-11"
            >
              Skip
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}



export default LoginPage;