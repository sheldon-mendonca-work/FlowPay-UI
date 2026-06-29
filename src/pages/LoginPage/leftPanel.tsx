import {
  ArrowRight,
  Activity,
  Layers,
  Workflow,
  CircuitBoard,
  Wallet,
} from "lucide-react";
import { LogoMark } from "@/components/logo-mark";


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

function ArchPreviewCard({
    ARCH_FLOW
}: {
    ARCH_FLOW: string[]
}) {
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

export function LeftPanel({
    ARCH_FLOW
}: {
    ARCH_FLOW: string[]
}) {
  
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

      <ArchPreviewCard ARCH_FLOW={ARCH_FLOW} />
    </section>
  );
}