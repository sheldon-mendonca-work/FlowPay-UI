import type { TimelineStep, Offer, PaymentResult } from "./types";
import { generateId, generateIdempotencyKey } from "./mock-data";

function makeStep(
  name: string,
  service: string,
  overrides?: Partial<TimelineStep>
): TimelineStep {
  return {
    id: generateId("step"),
    name,
    service,
    state: "pending",
    timestamp: null,
    ...overrides,
  };
}

export function buildTimelineSteps(offer?: Offer | null): TimelineStep[] {
  if (!offer) {
    return [
      makeStep("Payment Initiated", "payment-service"),
      makeStep("Payment Validated", "payment-service"),
      makeStep("Accounts Updated", "ledger-service"),
      makeStep("Payment Persisted", "payment-service"),
      makeStep("Outbox Event Created", "outbox-worker"),
      makeStep("Kafka Published", "kafka-broker"),
      makeStep("Completed", "payment-service"),
    ];
  }

  if (offer.type === "DISCOUNT") {
    return [
      makeStep("Payment Initiated", "payment-service"),
      makeStep("Offer Evaluated", "offer-service"),
      makeStep("Offer Reserved", "offer-service"),
      makeStep("Payment Validated", "payment-service"),
      makeStep("Accounts Updated", "ledger-service"),
      makeStep("Payment Persisted", "payment-service"),
      makeStep("Outbox Event Created", "outbox-worker"),
      makeStep("Kafka Published", "kafka-broker"),
      makeStep("Offer Redeemed", "offer-service"),
      makeStep("Completed", "payment-service"),
    ];
  }

  // CASHBACK
  return [
    makeStep("Payment Initiated", "payment-service"),
    makeStep("Offer Evaluated", "offer-service"),
    makeStep("Offer Reserved", "offer-service"),
    makeStep("Payment Validated", "payment-service"),
    makeStep("Accounts Updated", "ledger-service"),
    makeStep("Payment Persisted", "payment-service"),
    makeStep("Outbox Event Created", "outbox-worker"),
    makeStep("Kafka Published", "kafka-broker"),
    makeStep("Offer Redeemed", "offer-service"),
    makeStep("Promotion Pool Debited", "promo-service"),
    makeStep("Cashback Credited", "ledger-service"),
    makeStep("Completed", "payment-service"),
  ];
}

function buildRawPayload(
  name: string,
  result: PaymentResult,
  extra?: Record<string, unknown>
): Record<string, unknown> {
  const eventTypeMap: Record<string, string> = {
    "Payment Initiated":      "PAYMENT_INITIATED",
    "Offer Evaluated":        "OFFER_EVALUATED",
    "Offer Reserved":         "OFFER_RESERVED",
    "Payment Validated":      "PAYMENT_VALIDATED",
    "Accounts Updated":       "ACCOUNTS_UPDATED",
    "Payment Persisted":      "PAYMENT_PERSISTED",
    "Outbox Event Created":   "OUTBOX_EVENT_CREATED",
    "Kafka Published":        "KAFKA_PUBLISHED",
    "Offer Redeemed":         "OFFER_REDEEMED",
    "Promotion Pool Debited": "PROMO_POOL_DEBITED",
    "Cashback Credited":      "CASHBACK_CREDITED",
    "Completed":              "PAYMENT_COMPLETED",
  };

  return {
    eventType: eventTypeMap[name] ?? name.toUpperCase().replace(/\s+/g, "_"),
    eventId: generateId("evt"),
    traceId: result.traceId,
    requestId: result.requestId,
    paymentId: result.paymentId,
    timestamp: new Date().toISOString(),
    version: "1.0",
    source: "flowpay-core",
    ...(result.offerId ? { offerId: result.offerId } : {}),
    ...(result.reservationId ? { reservationId: result.reservationId } : {}),
    ...(result.redemptionId ? { redemptionId: result.redemptionId } : {}),
    idempotencyKey: result.idempotencyKey,
    ...extra,
  };
}

export async function* animateTimeline(
  steps: TimelineStep[],
  result: PaymentResult,
  onStep: (updated: TimelineStep[]) => void
): AsyncGenerator<void> {
  const working = steps.map((s) => ({ ...s }));

  const metaByName: Record<string, Partial<TimelineStep>> = {
    "Payment Initiated": {
      eventId: generateId("evt"),
      traceId: result.traceId,
      requestId: result.requestId,
      paymentId: result.paymentId,
      idempotencyKey: result.idempotencyKey,
    },
    "Offer Evaluated": {
      eventId: generateId("evt"),
      traceId: result.traceId,
      offerId: result.offerId,
    },
    "Offer Reserved": {
      eventId: generateId("evt"),
      traceId: result.traceId,
      offerId: result.offerId,
      reservationId: result.reservationId,
      idempotencyKey: result.idempotencyKey,
    },
    "Payment Validated": {
      eventId: generateId("evt"),
      traceId: result.traceId,
      paymentId: result.paymentId,
    },
    "Accounts Updated": {
      eventId: generateId("evt"),
      traceId: result.traceId,
      paymentId: result.paymentId,
    },
    "Payment Persisted": {
      eventId: generateId("evt"),
      traceId: result.traceId,
      paymentId: result.paymentId,
    },
    "Outbox Event Created": {
      eventId: generateId("evt"),
      traceId: result.traceId,
      paymentId: result.paymentId,
    },
    "Kafka Published": {
      eventId: generateId("evt"),
      traceId: result.traceId,
      paymentId: result.paymentId,
    },
    "Offer Redeemed": {
      eventId: generateId("evt"),
      traceId: result.traceId,
      offerId: result.offerId,
      reservationId: result.reservationId,
      redemptionId: result.redemptionId,
    },
    "Promotion Pool Debited": {
      eventId: generateId("evt"),
      traceId: result.traceId,
      offerId: result.offerId,
    },
    "Cashback Credited": {
      eventId: generateId("evt"),
      traceId: result.traceId,
      paymentId: result.paymentId,
    },
    "Completed": {
      eventId: generateId("evt"),
      traceId: result.traceId,
      paymentId: result.paymentId,
    },
  };

  for (let i = 0; i < working.length; i++) {
    // Mark as processing
    working[i] = { ...working[i], state: "processing", timestamp: new Date() };
    onStep([...working]);
    yield;

    await delay(350 + Math.random() * 300);

    const meta = metaByName[working[i].name] ?? {};
    const rawPayload = buildRawPayload(working[i].name, result, {
      ...(meta.eventId ? { eventId: meta.eventId } : {}),
    });

    // Mark as success
    working[i] = {
      ...working[i],
      state: "success",
      timestamp: new Date(),
      ...meta,
      rawPayload,
    };
    onStep([...working]);
    yield;

    await delay(120 + Math.random() * 180);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
