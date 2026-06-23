export type OfferType = "DISCOUNT" | "CASHBACK";
export type OfferStatus = "ACTIVE" | "EXHAUSTED" | "EXPIRED";
export type TxStatus = "COMPLETED" | "PENDING" | "FAILED" | "PROCESSING";
export type TimelineStepState = "pending" | "processing" | "success" | "failed";
export type Currency = "USD" | "INR" | "GBP";

export interface Offer {
  id: string;
  code: string;
  type: OfferType;
  benefitAmount: number;
  minPaymentAmount: number;
  remainingBudget: number;
  totalBudget: number;
  status: OfferStatus;
  description: string;
}

export interface User {
  id: string;
  accountId: string;
  name: string;
  avatarInitials: string;
  balance: number;
  currency: Currency;
}

export interface Transaction {
  id: string;
  time: Date;
  counterparty: string;
  amount: number;
  currency: Currency;
  status: TxStatus;
  direction: "in" | "out";
}

export interface TimelineStep {
  id: string;
  name: string;
  service: string;
  state: TimelineStepState;
  timestamp: Date | null;
  eventId?: string;
  traceId?: string;
  requestId?: string;
  paymentId?: string;
  offerId?: string;
  reservationId?: string;
  redemptionId?: string;
  idempotencyKey?: string;
  /** Raw JSON payload shown in the event inspector drawer */
  rawPayload?: Record<string, unknown>;
}

// ── Company / merchant types ──────────────────────────────────────────────────

export type OfferFundingStatus = "FUNDED" | "PENDING" | "EXHAUSTED";

export interface CompanyOffer {
  id: string;
  code: string;
  type: OfferType;
  benefitAmount: number;
  isPercentage: boolean;
  maxBenefit: number;
  minPaymentAmount: number;
  maxPaymentAmount: number | null;
  maxRedemptions: number;
  perUserLimit: number;
  startTime: Date;
  endTime: Date;
  promotionPoolName: string;
  initialBudget: number;
  remainingBudget: number;
  totalRedemptions: number;
  conversionRate: number;
  status: OfferStatus;
  fundingStatus: OfferFundingStatus;
  createdAt: Date;
}

export interface LiveActivityEvent {
  id: string;
  type: "payment_received" | "cashback_received" | "offer_redeemed" | "refund_received";
  amount?: number;
  currency?: Currency;
  from?: string;
  message: string;
  timestamp: Date;
  isNew?: boolean;
}

export interface PaymentResult {
  paymentId: string;
  traceId: string;
  requestId: string;
  offerId?: string;
  reservationId?: string;
  redemptionId?: string;
  idempotencyKey: string;
  senderDelta: number;
  receiverDelta: number;
  cashbackAmount?: number;
}
