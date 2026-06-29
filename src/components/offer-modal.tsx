

import { useState } from "react";
import { ChevronDown, Percent, DollarSign, Check, Tag, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Offer } from "@/types/types";

interface OfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offers: Offer[];
  selectedOfferId: string | null;
  onSelect: (offerId: string | null) => void;
  paymentAmount: number;
}

function fmt(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function OfferCard({
  offer,
  isSelected,
  eligible,
  paymentAmount,
  onApply,
}: {
  offer: Offer;
  isSelected: boolean;
  eligible: boolean;
  paymentAmount: number;
  onApply: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const isDiscount = offer.type === "DISCOUNT";

  // Consumer-friendly benefit line
  const benefitHeadline = isDiscount
    ? offer.benefitAmount < 20
      ? `Save ${offer.benefitAmount}% instantly`
      : `Flat ${fmt(offer.benefitAmount)} off`
    : offer.benefitAmount < 20
    ? `${offer.benefitAmount}% cashback`
    : `${fmt(offer.benefitAmount)} cashback`;

  const expectedBenefit =
    offer.benefitAmount < 20
      ? paymentAmount * (offer.benefitAmount / 100)
      : offer.benefitAmount;

  // Expiry: 14 days from now (mock)
  const expiryDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const expiryStr = expiryDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-200 overflow-hidden",
        isSelected
          ? isDiscount
            ? "border-info/50 bg-info/5 shadow-sm"
            : "border-success/50 bg-success/5 shadow-sm"
          : eligible
          ? "border-border bg-card hover:border-border/80"
          : "border-border/30 bg-card/50 opacity-50"
      )}
    >
      {/* Collapsed / always-visible header */}
      <button
        type="button"
        className="w-full px-4 py-3.5 flex items-center gap-3 text-left"
        onClick={() => eligible && setExpanded((v) => !v)}
        disabled={!eligible}
        aria-expanded={expanded}
      >
        {/* Icon */}
        <div
          className={cn(
            "size-9 rounded-lg flex items-center justify-center shrink-0",
            isDiscount ? "bg-info/15 text-info" : "bg-success/15 text-success"
          )}
        >
          {isDiscount ? (
            <Percent className="size-4" />
          ) : (
            <DollarSign className="size-4" />
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-mono font-bold text-foreground tracking-wide">
              {offer.code}
            </span>
            {isSelected && (
              <span className={cn(
                "text-[9px] px-1.5 py-px rounded font-bold uppercase border",
                isDiscount ? "border-info/40 text-info bg-info/10" : "border-success/40 text-success bg-success/10"
              )}>
                Applied
              </span>
            )}
            {!eligible && (
              <span className="text-[10px] text-muted-foreground font-mono">
                min {fmt(offer.minPaymentAmount)}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{benefitHeadline}</p>
          {eligible && (
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">
              Applicable above {fmt(offer.minPaymentAmount)}
            </p>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          {isSelected && <Check className={cn("size-4", isDiscount ? "text-info" : "text-success")} />}
          {eligible && (
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform duration-200",
                expanded && "rotate-180"
              )}
            />
          )}
        </div>
      </button>

      {/* Expanded details — consumer-friendly, no budgets or pool metadata */}
      {expanded && eligible && (
        <div className="px-4 pb-4 flex flex-col gap-3.5 border-t border-border/40">
          <div className="pt-3.5 grid grid-cols-2 gap-x-4 gap-y-3">
            {/* Benefit */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">
                {isDiscount ? "Discount" : "Cashback"}
              </p>
              <p className="text-sm font-semibold text-foreground">{benefitHeadline}</p>
            </div>

            {/* Expected savings for this payment */}
            {paymentAmount > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">
                  For this payment
                </p>
                <p className={cn(
                  "text-sm font-bold",
                  isDiscount ? "text-info" : "text-success"
                )}>
                  {isDiscount ? `-${fmt(expectedBenefit)}` : `+${fmt(expectedBenefit)}`}
                </p>
              </div>
            )}

            {/* Min payment */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">
                Minimum Payment
              </p>
              <p className="text-sm font-mono text-foreground">{fmt(offer.minPaymentAmount)}</p>
            </div>

            {/* Expiry */}
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Expires
              </p>
              <div className="flex items-center gap-1">
                <Clock className="size-3 text-muted-foreground" />
                <p className="text-sm font-mono text-foreground">{expiryStr}</p>
              </div>
            </div>
          </div>

          {/* Short description */}
          <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
            {offer.description}
          </p>

          {/* Apply button */}
          <Button
            type="button"
            onClick={onApply}
            className={cn("w-full h-9 text-sm font-semibold")}
            variant={isSelected ? "outline" : "default"}
          >
            {isSelected ? "Remove Offer" : "Apply"}
          </Button>
        </div>
      )}
    </div>
  );
}

export function OfferModal({
  open,
  onOpenChange,
  offers,
  selectedOfferId,
  onSelect,
  paymentAmount,
}: OfferModalProps) {
  const eligibleOffers = offers.filter((o) => paymentAmount >= o.minPaymentAmount);
  const ineligibleOffers = offers.filter((o) => paymentAmount < o.minPaymentAmount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Tag className="size-4 text-primary" />
            <DialogTitle className="text-base font-bold">Available Offers</DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {paymentAmount > 0
              ? `${eligibleOffers.length} offer${eligibleOffers.length !== 1 ? "s" : ""} available for your ${`$${paymentAmount.toFixed(2)}`} payment`
              : "Enter a payment amount to see eligible offers"}
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-2.5 p-4">
            {eligibleOffers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                isSelected={selectedOfferId === offer.id}
                eligible={true}
                paymentAmount={paymentAmount}
                onApply={() => {
                  onSelect(selectedOfferId === offer.id ? null : offer.id);
                  onOpenChange(false);
                }}
              />
            ))}

            {ineligibleOffers.length > 0 && (
              <>
                {eligibleOffers.length > 0 && (
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 h-px bg-border/50" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                      Not applicable
                    </span>
                    <div className="flex-1 h-px bg-border/50" />
                  </div>
                )}
                {ineligibleOffers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    isSelected={false}
                    eligible={false}
                    paymentAmount={paymentAmount}
                    onApply={() => {}}
                  />
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
