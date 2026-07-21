

import { cn } from "@/lib/utils";
import type { Transaction, TxStatus } from "@/types/types";

function statusConfig(s: TxStatus) {
  switch (s) {
    case "COMPLETED":
      return { label: "completed", color: "text-success", dot: "bg-success" };
    case "SUCCESS":
      return { label: "success", color: "text-success", dot: "bg-success" };
      case "PROCESSING":
        return { label: "processing",color: "text-info",    dot: "bg-info" };
      case "FAILED":
          return { label: "failed",    color: "text-destructive", dot: "bg-destructive" };
      case "PENDING":
        return { label: "pending",   color: "text-warning", dot: "bg-warning" };
  default:
        return { label: "pending",   color: "text-warning", dot: "bg-warning" };
  }
}

function formatTime(d: Date): string {
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 60_000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  const hrs = Math.floor(diff / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface TransactionTableProps {
  transactions: Transaction[];
  title?: string;
  /** Fixed container height with internal scroll, sticky header, "View All" top-right */
  fixedHeight?: boolean;
  /** Render only the rows — no outer border card or title (for embedding in a parent card) */
  bare?: boolean;
  /** Opens the Payment Details modal for the clicked row */
  onRowClick?: (tx: Transaction) => void;
}

export function TransactionTable({
  transactions,
  title = "Recent Transactions",
  fixedHeight = false,
  bare = false,
  onRowClick,
}: TransactionTableProps) {
  if (fixedHeight) {
    return (
      <div className="flex flex-col h-full bg-card">
        {/* Sticky header */}
        <div className="px-4 py-2.5 border-b border-border flex items-center justify-between shrink-0 bg-card z-10">
          <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            {title}
          </h3>
          <span className="text-[10px] font-mono text-primary cursor-pointer hover:text-primary/80 transition-colors">
            View All
          </span>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-3 px-4 py-1.5 border-b border-border/40 bg-card shrink-0">
          {["Time", "Counterparty", "Amount", "Status"].map((h) => (
            <span key={h} className="text-[9px] uppercase tracking-wider text-muted-foreground/70 font-medium">
              {h}
            </span>
          ))}
        </div>

        {/* Scrollable rows */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {transactions.map((tx) => {
            const cfg = statusConfig(tx.status);
            return (
              <div
                key={tx.id}
                onClick={() => onRowClick?.(tx)}
                className={cn(
                  "grid grid-cols-[1fr_1fr_auto_auto] gap-3 px-4 py-2 border-b border-border/25 last:border-0 hover:bg-accent/20 transition-colors",
                  onRowClick && "cursor-pointer"
                )}
              >
                <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
                  {formatTime(tx.time)}
                </span>
                <span className="text-[11px] text-foreground truncate">{tx.counterparty}</span>
                <span
                  className={cn(
                    "text-[11px] font-mono font-medium tabular-nums",
                    tx.direction === "out" ? "text-destructive" : "text-success"
                  )}
                >
                  {tx.direction === "out" ? "-" : "+"}$
                  {tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
                <div className="flex items-center gap-1">
                  <span className={cn("size-1.5 rounded-full shrink-0", cfg?.dot || "")} />
                  <span className={cn("text-[10px] font-mono capitalize", cfg.color)}>{cfg.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Rows-only block — shared between bare and default modes
  const rows = (
    <div className="overflow-hidden">
      <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-3 px-4 py-2 border-b border-border/50">
        {["Time", "Counterparty", "Amount", "Status"].map((h) => (
          <span key={h} className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            {h}
          </span>
        ))}
      </div>

      {transactions.length === 0 && (
        <div className="px-4 py-6 text-center text-xs text-muted-foreground">No transactions</div>
      )}

      {transactions.map((tx) => {
        const cfg = statusConfig(tx.status);
        return (
          <div
            key={tx.id}
            onClick={() => onRowClick?.(tx)}
            className={cn(
              "grid grid-cols-[1fr_1fr_auto_auto] gap-3 px-4 py-2.5 border-b border-border/30 last:border-0 hover:bg-accent/20 transition-colors",
              onRowClick && "cursor-pointer"
            )}
          >
            <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
              {formatTime(tx.time)}
            </span>
            <span className="text-[11px] text-foreground truncate">{tx.counterparty}</span>
            <span
              className={cn(
                "text-[11px] font-mono font-medium tabular-nums",
                tx.direction === "out" ? "text-destructive" : "text-success"
              )}
            >
              {tx.direction === "out" ? "-" : "+"}$
              {tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
            <div className="flex items-center gap-1">
              <span className={cn("size-1.5 rounded-full shrink-0", cfg.dot)} />
              <span className={cn("text-[10px] font-mono capitalize", cfg.color)}>{cfg.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Bare mode — no outer wrapper (for embedding in a parent card)
  if (bare) return rows;

  // Default (non-fixed) mode
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">{title}</h3>
        <span className="text-[10px] text-muted-foreground font-mono">{transactions.length} total</span>
      </div>
      {rows}
    </div>
  );
}
