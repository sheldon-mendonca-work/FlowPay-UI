

import { ScrollArea } from "@/components/ui/scroll-area";
import { WalletCard } from "@/components/wallet-card";
import { LiveActivityFeed } from "@/components/live-activity-feed";
import { TransactionTable } from "@/components/transaction-table";
import type { User, Transaction, LiveActivityEvent } from "@/lib/types";

interface ReceiverColumnProps {
  receiver: User;
  transactions: Transaction[];
  activityEvents: LiveActivityEvent[];
  balanceDelta: number;
}

export function ReceiverColumn({
  receiver,
  transactions,
  activityEvents,
  balanceDelta,
}: ReceiverColumnProps) {
  return (
    <div className="flex flex-col h-full pb-8">
      <div className="px-4 py-3 border-b border-border shrink-0">
        <h2 className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
          Receiver Wallet
        </h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-4">
          {/* Wallet */}
          <WalletCard user={receiver} variant="receiver" balanceDelta={balanceDelta} />

          {/* Live Activity Feed */}
          <LiveActivityFeed events={activityEvents} />

          {/* Recent Transactions */}
          <TransactionTable transactions={transactions} title="Received Transactions" />
        </div>
      </ScrollArea>
    </div>
  );
}
