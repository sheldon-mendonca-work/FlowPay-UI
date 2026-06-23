import { useEffect, useState } from "react";
import { LogoMark } from "./logo-mark";

const BOOT_STEPS = [
  "Initializing Gateway...",
  "Connecting Kafka...",
  "Loading Wallet Service...",
  "Loading Offer Engine...",
  "Ready.",
];


export function LoadingScreen() {
  const [step, setStep] = useState<number>(0);
  
  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => Math.min(s + 1, BOOT_STEPS.length - 1));
    }, 420);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-background/95 backdrop-blur">
      {/* stream particles */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="absolute h-1 w-16 rounded-full bg-gradient-to-r from-transparent via-[color:var(--accent-cyan)] to-transparent animate-stream"
            style={{
              top: `${(i * 7) % 100}%`,
              animationDelay: `${i * 0.25}s`,
              animationDuration: `${3 + (i % 4)}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-sm px-6 text-center">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center">
          <span className="absolute h-20 w-20 rounded-full border border-[color:var(--brand)]/30 animate-pulse-ring" />
          <span className="absolute h-20 w-20 rounded-full border border-[color:var(--brand)]/30 animate-pulse-ring" style={{ animationDelay: "1.2s" }} />
          <LogoMark className="h-12 w-12 animate-float" />
        </div>
        <div className="font-display text-lg font-semibold tracking-tight">
          Bringing FlowPay online
        </div>
        <ul className="mx-auto mt-5 max-w-[260px] space-y-1.5 text-left font-mono text-xs">
          {BOOT_STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li
                key={s}
                className={[
                  "flex items-center gap-2 transition-opacity",
                  i <= step ? "opacity-100" : "opacity-30",
                ].join(" ")}
              >
                <span
                  className={[
                    "inline-block h-1.5 w-1.5 rounded-full",
                    done
                      ? "bg-emerald-400"
                      : active
                        ? "bg-[color:var(--accent-cyan)] animate-ledger-tick"
                        : "bg-muted-foreground/40",
                  ].join(" ")}
                />
                <span>{s}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
