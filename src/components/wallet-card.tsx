

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { User } from "@/types/types";
import { getCurrencySymbol } from "@/utils/currency";
import { useMemo } from "react";

interface WalletCardProps {
  user: User;
  variant?: "sender" | "receiver";
}

export function WalletCard({ user, variant = "sender" }: WalletCardProps) {
  const currencySymbol = useMemo(() => {
    return getCurrencySymbol(user.currency)
  }, [user.currency])

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
          <span className="text-xs text-muted-foreground font-mono">{user.paymentHandle}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
              Available Balance
            </p>
            <p className="text-2xl font-bold font-mono tabular-nums text-foreground">
              {currencySymbol}{user.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <span className="text-xs font-mono text-muted-foreground pb-1">{user.currency}</span>
        </div>
      </div>
    </div>
  );
}
