import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, ChevronDown, Plus, X, Tag, Percent, DollarSign, ArrowRight, Search, Check, AlertCircle } from "lucide-react";
import { useSnackbar } from "notistack";
import { Button } from "@/components/ui/button";
import { WalletCard } from "@/components/wallet-card";
import { OfferModal } from "@/components/offer-modal";
import { TransactionTable } from "@/components/transaction-table";
import { cn } from "@/lib/utils";
import { searchReceivers, fetchAccountByPaymentHandle } from "@/api/receiverSearchAPI";
import { ApiError } from "@/axios/axiosSetup";
import type { User, Offer, Transaction, ReceiverResult, Currency } from "@/types/types";
import { getCurrencySymbol } from "@/utils/currency";

type ValidationStatus = "idle" | "loading" | "success" | "error";

interface SenderColumnProps {
  sender: User;
  selectedReceiver: ReceiverResult | null;
  onReceiverChange: (receiver: ReceiverResult | null) => void;
  offers: Offer[];
  transactions: Transaction[];
  onSendPayment: (amount: number, receiverId: string, offerId: string | null) => void;
  isProcessing: boolean;
  onSelectTransaction?: (tx: Transaction) => void;
}

const CURRENCIES = ["INR", "EUR", "GBP"] as const;

function fmt(n: number, currency: Currency = 'INR') {
  return `${getCurrencySymbol(currency)}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

function PaymentSummary({ amount, offer }: { amount: number; offer: Offer | null }) {
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
        <div className="flex items-center justify-between py-1.5">
          <span className="text-xs text-muted-foreground">Amount</span>
          <span className="text-xs font-mono text-foreground tabular-nums">{fmt(amount)}</span>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-xs text-muted-foreground">Discount</span>
          <span className={cn("text-xs font-mono tabular-nums", discountAmount > 0 ? "text-info font-semibold" : "text-muted-foreground")}>
            {discountAmount > 0 ? `-${fmt(discountAmount)}` : fmt(0)}
          </span>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-xs text-muted-foreground">Cashback</span>
          <span className={cn("text-xs font-mono tabular-nums", cashbackAmount > 0 ? "text-success font-semibold" : "text-muted-foreground")}>
            {cashbackAmount > 0 ? `+${fmt(cashbackAmount)}` : fmt(0)}
          </span>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-xs font-semibold text-foreground">You Pay</span>
          <span className="text-xs font-mono font-bold text-foreground tabular-nums">{fmt(youPay)}</span>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-xs text-muted-foreground">Receiver Gets</span>
          <span className="text-xs font-mono text-foreground tabular-nums">{fmt(receiverGets)}</span>
        </div>
        {cashbackAmount > 0 && (
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-muted-foreground">Expected Cashback</span>
            <span className="text-xs font-mono text-success font-semibold tabular-nums">{fmt(cashbackAmount)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ReceiverSearchCombobox({
  selected,
  pendingHandle,
  onSelectHandle,
  onClear,
}: {
  selected: ReceiverResult | null;
  pendingHandle: string | null;
  onSelectHandle: (handle: string) => void;
  onClear: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ReceiverResult[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const runSearch = useCallback(async (q: string, p: number, append = false) => {
    setIsLoading(true);
    const res = await searchReceivers(q, p, 5);
    setResults((prev) => (append ? [...prev, ...res.items] : res.items));
    setHasMore(res.hasMore);
    setIsLoading(false);
  }, []);

  // Debounced search on query change
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      setPage(1);
      runSearch(query, 1);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, isOpen, runSearch]);

  // // Load initial results when opening
  // useEffect(() => {
  //   if (isOpen) {
  //     setPage(1);
  //     runSearch(query, 1);
  //   }
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [isOpen]);

  // Click-outside dismiss
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  function openDropdown() {
    setIsOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleSelect(r: ReceiverResult) {
    onSelectHandle(r.paymentHandle);
    setIsOpen(false);
    setQuery("");
  }

  function handleSearchIconClick() {
    if (!query.trim()) return;
    onSelectHandle(query);
    setIsOpen(false);
    setQuery("");
  }

  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    runSearch(query, nextPage, true);
  }

  const triggerLabel = selected ? selected.name : pendingHandle ? pendingHandle : "Search receiver...";

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={openDropdown}
        className={cn(
          "w-full h-9 rounded-md border border-input bg-input text-sm px-3 pr-8 text-left flex items-center transition-colors",
          "focus:outline-none focus:ring-1 focus:ring-ring",
          selected || pendingHandle ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <span className="flex-1 truncate">
          {triggerLabel}
        </span>
        {selected || pendingHandle ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="absolute right-2.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear receiver"
          >
            <X className="size-3.5" />
          </button>
        ) : (
          <Search className="absolute right-2.5 size-3.5 text-muted-foreground pointer-events-none" />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-border/60 flex items-center gap-1.5">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, account ID, or payment handle…"
              className="flex-1 h-8 rounded-md border border-input bg-input text-xs text-foreground px-2.5 focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={handleSearchIconClick}
              disabled={!query.trim()}
              className="size-8 shrink-0 rounded-md border border-input bg-input flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:pointer-events-none"
              aria-label="Look up payment handle"
              title="Look up payment handle"
            >
              <Search className="size-3.5" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[200px] overflow-y-auto">
            {isLoading && results.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                Searching…
              </div>
            )}
            {!isLoading && results.length === 0 && (
              <div className="py-4 text-center text-xs text-muted-foreground">No results found</div>
            )}
            {results.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleSelect(r)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-left transition-colors hover:bg-accent",
                  selected?.id === r.id && "bg-primary/8"
                )}
              >
                <span className="text-xs font-medium text-foreground">{r.name}</span>
                <span className="text-[10px] font-mono text-muted-foreground">{r.paymentHandle}</span>
              </button>
            ))}
            {hasMore && (
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoading}
                className="w-full py-2 text-center text-[11px] text-primary hover:text-primary/80 border-t border-border/60 transition-colors disabled:opacity-50"
              >
                {isLoading ? "Loading…" : "Load more"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function SenderColumn({
  sender,
  selectedReceiver,
  onReceiverChange,
  offers,
  transactions,
  onSendPayment,
  isProcessing,
  onSelectTransaction,
}: SenderColumnProps) {
  const [amount, setAmount] = useState("250.00");
  const [currency, setCurrency] = useState<string>("INR");
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>("idle");
  const [pendingHandle, setPendingHandle] = useState<string | null>(null);
  const validationSeqRef = useRef(0);
  const { enqueueSnackbar } = useSnackbar();

  const parsedAmount = parseFloat(amount) || 0;
  const selectedOffer = offers.find((o) => o.id === selectedOfferId) ?? null;

  const discountAmount =
    selectedOffer?.type === "DISCOUNT"
      ? selectedOffer.benefitAmount < 20
        ? parsedAmount * (selectedOffer.benefitAmount / 100)
        : selectedOffer.benefitAmount
      : 0;

  const netAmount = Math.max(0, parsedAmount - discountAmount);

  const handleSelectHandle = useCallback(async (handle: string) => {
    const trimmed = handle.trim();
    if (!trimmed) return;

    const seq = ++validationSeqRef.current;
    setPendingHandle(trimmed);
    setValidationStatus("loading");
    onReceiverChange(null);

    try {
      const receiver = await fetchAccountByPaymentHandle(trimmed);
      if (seq !== validationSeqRef.current) return;
      setValidationStatus("success");
      onReceiverChange(receiver);
    } catch (err) {
      if (seq !== validationSeqRef.current) return;
      setValidationStatus("error");
      onReceiverChange(null);
      const message = err instanceof ApiError && err.code === "404"
        ? "User not found"
        : "Failed to look up user";
      enqueueSnackbar(message, { variant: "error" });
    }
  }, [onReceiverChange, enqueueSnackbar]);

  function handleClearReceiver() {
    validationSeqRef.current++;
    setPendingHandle(null);
    setValidationStatus("idle");
    onReceiverChange(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!parsedAmount || isProcessing || !selectedReceiver || validationStatus !== "success") return;
    onSendPayment(parsedAmount, selectedReceiver.id, selectedOfferId);
  }

  const canPay = parsedAmount > 0 && !!selectedReceiver && validationStatus === "success" && !isProcessing;

  return (
    <div className="flex flex-col h-full border-r border-border overflow-hidden pb-8">

      <div className="px-4 py-3 border-b border-border shrink-0">
        <h2 className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
          Sender Wallet
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="flex flex-col gap-3 p-4 pb-0">

          <WalletCard user={sender} variant="sender" />

          <div className="rounded-lg border border-border bg-card">
            <div className="px-4 py-2.5 border-b border-border/60">
              <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Send Payment
              </h3>
            </div>

            <form id="payment-form" onSubmit={handleSubmit} className="flex flex-col gap-3.5 p-4">
              {/* Receiver search */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Receiver
                </label>
                <ReceiverSearchCombobox
                  selected={selectedReceiver}
                  pendingHandle={pendingHandle}
                  onSelectHandle={handleSelectHandle}
                  onClear={handleClearReceiver}
                />
                {validationStatus === "loading" && (
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" />
                    Validating user…
                  </div>
                )}
                {validationStatus === "success" && selectedReceiver && (
                  <div className="flex items-center gap-1.5 text-[10px] text-success font-medium">
                    <Check className="size-3" />
                    User found · {selectedReceiver.paymentHandle} · {selectedReceiver.currency}
                  </div>
                )}
                {validationStatus === "error" && (
                  <div className="flex items-center gap-1.5 text-[10px] text-destructive font-medium">
                    <AlertCircle className="size-3" />
                    User not found
                  </div>
                )}
              </div>

              {/* Amount + Currency */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Amount
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">
                      {getCurrencySymbol(currency)}
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

          <PaymentSummary amount={parsedAmount} offer={selectedOffer} />

          <div className="h-1" />
        </div>
      </div>

      {/* Sticky pay button */}
      <div className="px-3 py-2.5 border-t border-border bg-card shrink-0">
        <Button
          type="submit"
          form="payment-form"
          disabled={!canPay}
          className="w-full h-12 font-bold text-[15px] tracking-wide"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 data-icon="inline-start" className="animate-spin" />
              Processing...
            </>
          ) : validationStatus === "loading" ? (
            "Validating user..."
          ) : !selectedReceiver ? (
            "Select a receiver"
          ) : parsedAmount > 0 ? (
            selectedOffer?.type === "DISCOUNT"
              ? `Pay ${fmt(netAmount)}`
              : `Pay ${fmt(parsedAmount)}`
          ) : (
            "Enter an amount"
          )}
        </Button>
        {!selectedReceiver && validationStatus === "idle" && !isProcessing && (
          <p className="text-[10px] text-center text-muted-foreground mt-1.5">
            Search and select a receiver above
          </p>
        )}
      </div>

      {/* Fixed-height scrollable transactions */}
      <div className="shrink-0 border-t border-border flex flex-col" style={{ height: "220px" }}>
        <TransactionTable transactions={transactions} fixedHeight onRowClick={onSelectTransaction} />
      </div>

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
