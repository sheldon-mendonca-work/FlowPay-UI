import type {
  TimelineStep,
  TimelineStepState,
  Offer,
  PaymentTimelineStepName,
  PaymentTimelineDTO,
  NotificationStatus,
} from "../types/types";

export function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

export function generateIdempotencyKey(): string {
  return `idem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}


const STEP_META: Record<PaymentTimelineStepName, { name: string; service: string }> = {
  PAYMENT_INITIATED:    { name: "Payment Initiated",      service: "payment-service" },
  OFFER_EVALUATED:      { name: "Offer Evaluated",        service: "offer-service" },
  OFFER_RESERVED:       { name: "Offer Reserved",         service: "offer-service" },
  PAYMENT_VALIDATED:    { name: "Payment Validated",      service: "payment-service" },
  ACCOUNTS_UPDATED:     { name: "Accounts Updated",       service: "ledger-service" },
  PAYMENT_PERSISTED:    { name: "Payment Persisted",      service: "payment-service" },
  OUTBOX_EVENT_CREATED: { name: "Outbox Event Created",   service: "outbox-worker" },
  KAFKA_PUBLISHED:      { name: "Kafka Published",        service: "kafka-broker" },
  TRANSACTIONS_COMPLETED: { name: "Transactions Completed", service: "ledger-service" },
  OFFER_REDEEMED:       { name: "Offer Redeemed",         service: "offer-service" },
  PROMO_POOL_DEBITED:   { name: "Promotion Pool Debited", service: "promo-service" },
  CASHBACK_CREDITED:    { name: "Cashback Credited",      service: "ledger-service" },
  PAYMENT_COMPLETED:    { name: "Completed",              service: "payment-service" },
};

const NO_OFFER_STEPS: PaymentTimelineStepName[] = [
  "PAYMENT_INITIATED",
  "KAFKA_PUBLISHED",
  "PAYMENT_VALIDATED",
  "ACCOUNTS_UPDATED",
  "PAYMENT_PERSISTED",
  "OUTBOX_EVENT_CREATED",
  "PAYMENT_COMPLETED",
];

const DISCOUNT_STEPS: PaymentTimelineStepName[] = [
  "PAYMENT_INITIATED",
  "KAFKA_PUBLISHED",
  "OFFER_EVALUATED",
  "OFFER_RESERVED",
  "PAYMENT_VALIDATED",
  "ACCOUNTS_UPDATED",
  "PAYMENT_PERSISTED",
  "OUTBOX_EVENT_CREATED",
  "OFFER_REDEEMED",
  "PAYMENT_COMPLETED",
];

const CASHBACK_STEPS: PaymentTimelineStepName[] = [
  "PAYMENT_INITIATED",
  "KAFKA_PUBLISHED",
  "OFFER_EVALUATED",
  "OFFER_RESERVED",
  "PAYMENT_VALIDATED",
  "ACCOUNTS_UPDATED",
  "PAYMENT_PERSISTED",
  "OUTBOX_EVENT_CREATED",
  "OFFER_REDEEMED",
  "PROMO_POOL_DEBITED",
  "CASHBACK_CREDITED",
  "PAYMENT_COMPLETED",
];

function makeStep(stepName: PaymentTimelineStepName): TimelineStep {
  const meta = STEP_META[stepName];
  return {
    id: generateId("step"),
    stepName,
    name: meta.name,
    service: meta.service,
    state: "pending",
    timestamp: null,
  };
}

/** Ordered skeleton of pending steps for the pipeline this payment will follow. */
export function buildTimelineSteps(offer?: Offer | null): TimelineStep[] {
  const order = !offer
    ? NO_OFFER_STEPS
    : offer.type === "DISCOUNT"
    ? DISCOUNT_STEPS
    : CASHBACK_STEPS;
  return order.map(makeStep);
}

const PAYMENT_DETAILS_STEPS: PaymentTimelineStepName[] = [
  "PAYMENT_INITIATED",
  "OFFER_EVALUATED",
  "OFFER_RESERVED",
  "PAYMENT_VALIDATED",
  "ACCOUNTS_UPDATED",
  "PAYMENT_PERSISTED",
  "TRANSACTIONS_COMPLETED",
  "OFFER_REDEEMED",
  "PAYMENT_COMPLETED",
];

const PAYMENT_DETAILS_STEPS_NO_OFFER: PaymentTimelineStepName[] = PAYMENT_DETAILS_STEPS.filter(
  (s) => s !== "OFFER_EVALUATED" && s !== "OFFER_RESERVED" && s !== "OFFER_REDEEMED",
);

/** Ordered skeleton for the Payment Details page timeline — offer steps hidden when there's no offer. */
export function buildPaymentDetailsTimelineSteps(hasOffer: boolean): TimelineStep[] {
  const order = hasOffer ? PAYMENT_DETAILS_STEPS : PAYMENT_DETAILS_STEPS_NO_OFFER;
  return order.map(makeStep);
}

const STATUS_TO_STATE: Record<NotificationStatus, TimelineStepState> = {
  CREATED:    "processing",
  PROCESSING: "processing",
  SUCCESS:    "success",
  FAILED:     "failed",
};

/**
 * Overlay a PaymentTimelineDTO snapshot pushed over the notification SSE
 * stream onto the local step skeleton. Steps absent from `timeline_steps`
 * haven't been reached by the backend yet and stay "pending".
 */
export function mergeTimelineSnapshot(
  steps: TimelineStep[],
  dto: PaymentTimelineDTO,
): TimelineStep[] {
  const rowByStep = new Map(dto.timeline_steps.map((row) => [row.step_name, row]));

  return steps.map((step) => {
    const row = step.stepName ? rowByStep.get(step.stepName) : undefined;
    if (!row) return step;

    return {
      ...step,
      state: STATUS_TO_STATE[row.status],
      timestamp: row.completed_time ? new Date(row.completed_time) : step.timestamp,
      stepTimeMs: row.completed_step_time,
      traceId: dto.trace_id,
      paymentId: dto.payment_id,
      rawPayload: { ...row, trace_id: dto.trace_id, payment_id: dto.payment_id },
    };
  });
}

export function isTimelineFailed(dto: PaymentTimelineDTO): boolean {
  return dto.status === "FAILED";
}

export function isTimelineComplete(dto: PaymentTimelineDTO): boolean {
  return dto.timeline_steps.some(
    (row) => row.step_name === "PAYMENT_COMPLETED" && row.status === "SUCCESS",
  );
}
