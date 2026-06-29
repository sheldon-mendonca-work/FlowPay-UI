import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WalletCard } from "@/components/wallet-card";
import { LiveActivityFeed } from "@/components/live-activity-feed";
import { TransactionTable } from "@/components/transaction-table";
import { fetchActivityFeed } from "@/api/activityFeedAPI";
import { fetchTransactions } from "@/api/transactionsAPI";
import type { NavAccount, LiveActivityEvent, Transaction } from "@/types/types";

interface ReceiverColumnProps {
  navAccount: NavAccount;
  newActivityEvents: LiveActivityEvent[];
  balanceDelta: number;
}

export function ReceiverColumn({
  navAccount,
  newActivityEvents,
  balanceDelta,
}: ReceiverColumnProps) {
  const [activityEvents, setActivityEvents] = useState<LiveActivityEvent[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txPage, setTxPage] = useState(1);
  const [txHasMore, setTxHasMore] = useState(false);
  const [txTotal, setTxTotal] = useState(0);

  // Fetch activity feed when account changes
  useEffect(() => {
    fetchActivityFeed(navAccount.id).then(setActivityEvents);
    setTxPage(1);
  }, [navAccount.id]);

  // Fetch transactions when account or page changes
  useEffect(() => {
    fetchTransactions(navAccount.id, txPage).then((result) => {
      setTransactions(result.items);
      setTxHasMore(result.hasMore);
      setTxTotal(result.total);
    });
  }, [navAccount.id, txPage]);

  // Prepend new events from payment flow
  useEffect(() => {
    if (newActivityEvents.length > 0) {
      setActivityEvents((prev) => [...newActivityEvents, ...prev]);
    }
  }, [newActivityEvents]);

  const pageSize = 5;
  const totalPages = Math.ceil(txTotal / pageSize);

  return (
    <div className="flex flex-col h-full pb-8">
      <div className="px-4 py-3 border-b border-border shrink-0">
        <h2 className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
          Receiver Wallet
        </h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-4">
          <WalletCard user={navAccount} variant="receiver" balanceDelta={balanceDelta} />

          <LiveActivityFeed events={activityEvents} />

          {/* Paginated transaction table */}
          <div className="rounded-lg border border-border bg-card">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Received Transactions
              </h3>
              <span className="text-[10px] text-muted-foreground font-mono">{txTotal} total</span>
            </div>

            <TransactionTable transactions={transactions} bare />

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="px-4 py-2.5 border-t border-border/60 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                  disabled={txPage === 1}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="size-3.5" />
                  Prev
                </button>
                <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
                  {txPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setTxPage((p) => p + 1)}
                  disabled={!txHasMore}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  Next
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
