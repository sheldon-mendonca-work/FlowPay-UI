

import { useState } from "react";
import { Loader2, ChevronDown, Plus, X, Tag, Percent, DollarSign, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WalletCard } from "@/components/wallet-card";
import { OfferModal } from "@/components/offer-modal";
import { TransactionTable } from "@/components/transaction-table";
import { cn } from "@/lib/utils";
import type { User, Offer, Transaction } from "@/lib/types";

interface SenderColumnProps {
  sender: User;
  receivers: User[];
  offers: Offer[];
  transactions: Transaction[];
  selectedReceiverId: string;
  onReceiverChange: (id: string) => void;
  onSendPayment: (amount: number, receiverId: string, offerId: string | null) => void;
  isProcessing: boolean;
  balanceDelta: number;
}

const CURRENCIES = ["USD", "EUR", "GBP"] as const;

function fmt(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function AppliedOfferChip({
  offer,
  amount,
  onRemove,
}: {
  offer: Offer;
  amount: number;
  onRemove: () => void;
}) {
  const isDiscount = offer.type === "DISCOUNT";
  const benefitValue =
    offer.benefitAmount < 20
      ? amount * (offer.benefitAmount / 100)
      : offer.benefitAmount;

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg border px-3 py-2.5",
        isDiscount
          ? "border-info/30 bg-info/8"
          : "border-success/30 bg-success/8"
      )}
    >
      <div
        className={cn(
          "size-6 rounded flex items-center justify-center shrink-0",
          isDiscount ? "bg-info/15 text-info" : "bg-success/15 text-success"
        )}
      >
        {isDiscount ? <Percent className="size-3.5" /> : <DollarSign className="size-3.5" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono font-semibold text-foreground">{offer.code}</span>
          <span
            className={cn(
              "text-[9px] px-1 py-px rounded font-mono font-bold uppercase border",
              isDiscount
                ? "border-info/30 text-info bg-info/10"
                : "border-success/30 text-success bg-success/10"
            )}
          >
            {offer.type}
          </span>
        </div>
        <p className={cn("text-[11px] mt-0.5", isDiscount ? "text-info" : "text-success")}>
          Expected benefit: {fmt(benefitValue)}
        </p>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="size-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
        aria-label="Remove offer"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

/** Always-visible payment summary — 3 states: no offer / discount / cashback */
function PaymentSummary({
  amount,
  offer,
}: {
  amount: number;
  offer: Offer | null;
}) {
  const discountAmount =
    offer?.type === "DISCOUNT"
      ? offer.benefitAmount < 20
        ? amount * (offer.benefitAmount / 100)
        : offer.benefitAmount
      : 0;

  const cashbackAmount =
    offer?.type === "CASHBACK"
      ? offer.benefitAmount < 20
        ? amount * (offer.benefitAmount / 100)
        : offer.benefitAmount
      : 0;

  const youPay = Math.max(0, amount - discountAmount);
  const receiverGets = youPay;

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="px-4 py-2.5 border-b border-border/60">
        <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          Payment Summary
        </h3>
      </div>

      <div className="px-4 py-3 flex flex-col divide-y divide-border/50">
        {/* Amount row */}
        <div className="flex items-center justify-between py-1.5">
          <span className="text-xs text-muted-foreground">Amount</span>
          <span className="text-xs font-mono text-foreground tabular-nums">{fmt(amount)}</span>
        </div>

        {/* Discount row — always shown */}
        <div className="flex items-center justify-between py-1.5">
          <span className="text-xs text-muted-foreground">Discount</span>
          <span
            className={cn(
              "text-xs font-mono tabular-nums",
              discountAmount > 0 ? "text-info font-semibold" : "text-muted-foreground"
            )}
          >
            {discountAmount > 0 ? `-${fmt(discountAmount)}` : fmt(0)}
          </span>
        </div>

        {/* Cashback row — always shown */}
        <div className="flex items-center justify-between py-1.5">
          <span className="text-xs text-muted-foreground">Cashback</span>
          <span
            className={cn(
              "text-xs font-mono tabular-nums",
              cashbackAmount > 0 ? "text-success font-semibold" : "text-muted-foreground"
            )}
          >
            {cashbackAmount > 0 ? `+${fmt(cashbackAmount)}` : fmt(0)}
          </span>
        </div>

        {/* Divider before totals */}
        <div className="flex items-center justify-between py-1.5">
          <span className="text-xs font-semibold text-foreground">You Pay</span>
          <span className="text-xs font-mono font-bold text-foreground tabular-nums">
            {fmt(youPay)}
          </span>
        </div>

        <div className="flex items-center justify-between py-1.5">
          <span className="text-xs text-muted-foreground">Receiver Gets</span>
          <span className="text-xs font-mono text-foreground tabular-nums">
            {fmt(receiverGets)}
          </span>
        </div>

        {cashbackAmount > 0 && (
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-muted-foreground">Expected Cashback</span>
            <span className="text-xs font-mono text-success font-semibold tabular-nums">
              {fmt(cashbackAmount)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function SenderColumn({
  sender,
  receivers,
  offers,
  transactions,
  selectedReceiverId,
  onReceiverChange,
  onSendPayment,
  isProcessing,
  balanceDelta,
}: SenderColumnProps) {
  const [amount, setAmount] = useState("250.00");
  const [currency, setCurrency] = useState<string>("USD");
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [offerModalOpen, setOfferModalOpen] = useState(false);

  const parsedAmount = parseFloat(amount) || 0;
  const selectedOffer = offers.find((o) => o.id === selectedOfferId) ?? null;

  const discountAmount =
    selectedOffer?.type === "DISCOUNT"
      ? selectedOffer.benefitAmount < 20
        ? parsedAmount * (selectedOffer.benefitAmount / 100)
        : selectedOffer.benefitAmount
      : 0;

  const netAmount = Math.max(0, parsedAmount - discountAmount);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!parsedAmount || isProcessing) return;
    onSendPayment(parsedAmount, selectedReceiverId, selectedOfferId);
  }

  return (
    /* Full-viewport-height column — flex col, nothing overflows the column */
    <div className="flex flex-col h-full border-r border-border overflow-hidden pb-8">

      {/* ── Column header ── */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <h2 className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
          Sender Wallet
        </h2>
      </div>

      {/* ── Upper scrollable area: wallet + form + summary ── */}
      {/* This area scrolls but transactions are separate below */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="flex flex-col gap-3 p-4 pb-0">

          {/* Wallet card */}
          <WalletCard user={sender} variant="sender" balanceDelta={balanceDelta} />

          {/* Send Payment form */}
          <div className="rounded-lg border border-border bg-card">
            <div className="px-4 py-2.5 border-b border-border/60">
              <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Send Payment
              </h3>
            </div>

            <form id="payment-form" onSubmit={handleSubmit} className="flex flex-col gap-3.5 p-4">
              {/* Receiver */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Receiver
                </label>
                <div className="relative">
                  <select
                    value={selectedReceiverId}
                    onChange={(e) => onReceiverChange(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-input text-sm text-foreground px-3 pr-8 appearance-none focus:outline-none focus:ring-1 focus:ring-ring transition-colors cursor-pointer"
                  >
                    {receivers.map((r) => (
                      <option key={r.id} value={r.id} className="bg-card">
                        {r.name} — {r.accountId}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Amount + Currency */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Amount
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">
                      $
                    </span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="1"
                      step="0.01"
                      className="w-full h-9 rounded-md border border-input bg-input text-sm text-foreground pl-7 pr-3 font-mono focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="h-9 rounded-md border border-input bg-input text-sm text-foreground px-2 pr-7 appearance-none focus:outline-none focus:ring-1 focus:ring-ring transition-colors cursor-pointer font-mono"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c} className="bg-card">{c}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Offer section */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Offer
                  </label>
                  {!selectedOffer && (
                    <button
                      type="button"
                      onClick={() => setOfferModalOpen(true)}
                      className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      <Plus className="size-3" />
                      Add Offer
                    </button>
                  )}
                </div>

                {selectedOffer ? (
                  <div className="flex flex-col gap-1.5">
                    <AppliedOfferChip
                      offer={selectedOffer}
                      amount={parsedAmount}
                      onRemove={() => setSelectedOfferId(null)}
                    />
                    <button
                      type="button"
                      onClick={() => setOfferModalOpen(true)}
                      className="text-[11px] text-muted-foreground hover:text-primary transition-colors self-start"
                    >
                      Change offer
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-2.5 rounded-lg border border-dashed border-border/60 bg-card/50 px-3 py-2.5 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all group"
                    onClick={() => setOfferModalOpen(true)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setOfferModalOpen(true)}
                  >
                    <Tag className="size-4 text-muted-foreground/50 group-hover:text-primary/60 transition-colors shrink-0" />
                    <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                      No offer applied
                    </p>
                    <ArrowRight className="size-3.5 text-muted-foreground/30 group-hover:text-primary/50 ml-auto transition-colors" />
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Payment Summary — always rendered */}
          <PaymentSummary amount={parsedAmount} offer={selectedOffer} />

          {/* Gap before sticky pay button */}
          <div className="h-1" />
        </div>
      </div>

      {/* ── Sticky pay button ── */}
      <div className="px-3 py-2.5 border-t border-border bg-card shrink-0">
        <Button
          type="submit"
          form="payment-form"
          disabled={isProcessing || !parsedAmount}
          className="w-full h-12 font-bold text-[15px] tracking-wide"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 data-icon="inline-start" className="animate-spin" />
              Processing...
            </>
          ) : parsedAmount > 0 ? (
            selectedOffer?.type === "DISCOUNT"
              ? `Pay ${fmt(netAmount)}`
              : `Pay ${fmt(parsedAmount)}`
          ) : (
            "Enter an amount"
          )}
        </Button>
        {!parsedAmount && (
          <p className="text-[10px] text-center text-muted-foreground mt-1.5">
            Enter a payment amount above
          </p>
        )}
      </div>

      {/* ── Fixed-height scrollable transactions ── */}
      <div className="shrink-0 border-t border-border flex flex-col" style={{ height: "220px" }}>
        <TransactionTable transactions={transactions} fixedHeight />
      </div>

      {/* Offer selection modal */}
      <OfferModal
        open={offerModalOpen}
        onOpenChange={setOfferModalOpen}
        offers={offers}
        selectedOfferId={selectedOfferId}
        onSelect={setSelectedOfferId}
        paymentAmount={parsedAmount}
      />
    </div>
  );
}
