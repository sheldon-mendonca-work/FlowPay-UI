

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";

interface WalletCardProps {
  user: User;
  variant?: "sender" | "receiver";
  balanceDelta?: number;
}

export function WalletCard({ user, variant = "sender", balanceDelta }: WalletCardProps) {
  const displayBalance = user.balance + (balanceDelta ?? 0);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarFallback
            className={cn(
              "text-sm font-semibold",
              variant === "sender"
                ? "bg-primary/20 text-primary"
                : "bg-success/20 text-success"
            )}
          >
            {user.avatarInitials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">{user.name}</span>
            <span
              className={cn(
                "text-[10px] px-1.5 py-px rounded font-mono font-medium border shrink-0",
                variant === "sender"
                  ? "border-primary/30 text-primary bg-primary/10"
                  : "border-success/30 text-success bg-success/10"
              )}
            >
              {variant === "sender" ? "SENDER" : "RECEIVER"}
            </span>
          </div>
          <span className="text-xs text-muted-foreground font-mono">{user.accountId}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
              Available Balance
            </p>
            <p className={cn(
              "text-2xl font-bold font-mono tabular-nums transition-all",
              balanceDelta && balanceDelta > 0 ? "text-success" : "text-foreground",
              balanceDelta && balanceDelta < 0 ? "text-destructive" : ""
            )}>
              ${displayBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <span className="text-xs font-mono text-muted-foreground pb-1">{user.currency}</span>
        </div>
      </div>
    </div>
  );
}
