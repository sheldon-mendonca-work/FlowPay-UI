import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchPaymentDetails } from "@/api/paymentDetailsAPI";
import { PaymentSummaryCard, PaymentSummarySkeleton } from "./payment-summary-card";
import { OfferCard } from "./offer-card";
import { PaymentTimelineSection } from "./timeline-section";
import { AccountingTransactionsSection } from "./accounting-transactions-section";
import { PaymentStatusBadge } from "./status-badge";
import type { PaymentDetails } from "@/types/types";

interface PaymentDetailsModalProps {
  paymentId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function PaymentDetailsModal({ paymentId, onOpenChange }: PaymentDetailsModalProps) {
  const [details, setDetails] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(
    (id: string, signal?: AbortSignal) => {
      setLoading(true);
      setError(false);
      fetchPaymentDetails(id, signal)
        .then(setDetails)
        .catch((err) => {
          if (signal?.aborted) return;
          console.error("Failed to fetch payment details:", err);
          setError(true);
        })
        .finally(() => {
          if (!signal?.aborted) setLoading(false);
        });
    },
    [],
  );

  useEffect(() => {
    if (!paymentId) return;
    setDetails(null);
    const controller = new AbortController();
    load(paymentId, controller.signal);
    return () => controller.abort();
  }, [paymentId, load]);

  return (
    <Dialog open={!!paymentId} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="p-0 gap-0 w-full max-w-[calc(100%-2rem)] sm:max-w-2xl lg:max-w-4xl max-h-[90vh] flex flex-col"
      >
        <DialogHeader className="flex-row items-center justify-between gap-3 px-5 py-4 border-b border-border shrink-0 pr-12">
          <DialogTitle>Payment Details</DialogTitle>
          {details && <PaymentStatusBadge status={details.status} size="md" />}
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-4 p-5">
            <div className="flex flex-col gap-4 min-w-0">
              {loading ? (
                <PaymentSummarySkeleton />
              ) : error || !details ? (
                <div className="rounded-lg border border-border bg-card flex flex-col items-center justify-center gap-3 py-10 px-4">
                  <AlertTriangle className="size-5 text-destructive" />
                  <p className="text-xs text-muted-foreground text-center">
                    Failed to load payment details
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => paymentId && load(paymentId)}
                  >
                    <RotateCw data-icon="inline-start" className="size-3.5" />
                    Retry
                  </Button>
                </div>
              ) : (
                <>
                  <PaymentSummaryCard details={details} />
                  {details.offer && (
                    <OfferCard offer={details.offer} currency={details.currency} />
                  )}
                </>
              )}
            </div>

            <div className="flex flex-col gap-4 min-w-0">
              {paymentId && <PaymentTimelineSection paymentId={paymentId} />}
              {paymentId && <AccountingTransactionsSection paymentId={paymentId} />}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
