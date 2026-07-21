import { useEffect, useState, useCallback } from "react";
import { ChevronDown, AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getCurrencySymbol } from "@/utils/currency";
import { fetchPaymentAccountingTransactions } from "@/api/paymentAccountingAPI";
import type { AccountingTransaction } from "@/types/types";

function fmt(amount: number, currency: string) {
  return `${getCurrencySymbol(currency)}${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

function fmtDateTime(d: Date) {
  return d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

function AccountingRow({ tx }: { tx: AccountingTransaction }) {
  const isDebit = tx.category === "DEBIT";
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-2.5 border-b border-border/30 last:border-0 hover:bg-accent/20 transition-colors items-center">
      <span className="text-[11px] font-mono text-muted-foreground truncate">{tx.id}</span>
      <span className="text-[11px] text-foreground">{tx.account}</span>
      <span
        className={cn(
          "text-[10px] font-mono font-medium uppercase px-1.5 py-px rounded border shrink-0",
          isDebit
            ? "border-destructive/30 text-destructive bg-destructive/10"
            : "border-success/30 text-success bg-success/10"
        )}
      >
        {tx.category}
      </span>
      <span className="text-[11px] font-mono font-medium tabular-nums text-foreground shrink-0">
        {isDebit ? "-" : "+"}
        {fmt(tx.amount, tx.currency)}
      </span>
      <span className="text-[10px] font-mono text-muted-foreground tabular-nums shrink-0">
        {fmtDateTime(tx.createdAt)}
      </span>
    </div>
  );
}

export function AccountingTransactionsSection({ paymentId }: { paymentId: string }) {
  const [transactions, setTransactions] = useState<AccountingTransaction[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(
    (signal?: AbortSignal) => {
      setLoading(true);
      setError(false);
      fetchPaymentAccountingTransactions(paymentId, signal)
        .then(setTransactions)
        .catch((err) => {
          if (signal?.aborted) return;
          console.error("Failed to fetch accounting transactions:", err);
          setError(true);
        })
        .finally(() => {
          if (!signal?.aborted) setLoading(false);
        });
    },
    [paymentId],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
        aria-expanded={expanded}
      >
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Accounting Transactions
        </h3>
        <div className="flex items-center gap-2">
          {transactions && (
            <span className="text-[10px] text-muted-foreground font-mono">
              {transactions.length} total
            </span>
          )}
          <ChevronDown
            className={cn(
              "size-3.5 text-muted-foreground transition-transform shrink-0",
              expanded && "rotate-180"
            )}
          />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/60">
          {loading && (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded" />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center gap-3 py-8 px-4">
              <AlertTriangle className="size-5 text-destructive" />
              <p className="text-xs text-muted-foreground text-center">
                Failed to load accounting transactions
              </p>
              <Button variant="outline" size="sm" onClick={() => load()}>
                <RotateCw data-icon="inline-start" className="size-3.5" />
                Retry
              </Button>
            </div>
          )}

          {!loading && !error && transactions && (
            <div className="overflow-x-auto">
              <div className="min-w-[560px]">
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-2 border-b border-border/50">
                  {["Transaction ID", "Account", "Type", "Amount", "Created"].map((h) => (
                    <span
                      key={h}
                      className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium"
                    >
                      {h}
                    </span>
                  ))}
                </div>
                {transactions.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                    No accounting transactions
                  </div>
                ) : (
                  transactions.map((tx) => <AccountingRow key={tx.id} tx={tx} />)
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
