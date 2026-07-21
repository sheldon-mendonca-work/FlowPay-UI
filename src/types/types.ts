export type OfferType = "DISCOUNT" | "CASHBACK";
export type OfferStatus = "ACTIVE" | "EXHAUSTED" | "EXPIRED";
export type TxStatus = "COMPLETED" | "SUCCESS" | "PENDING" | "FAILED" | "PROCESSING";
export type TimelineStepState = "pending" | "processing" | "success" | "failed";
export type Currency = "INR" | "USD" | "GBP";

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
  paymentHandle: string;
  name: string;
  avatarInitials: string;
  balance: number;
  currency: Currency;
}

export interface Transaction {
  id: string;
  paymentId: string;
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
  stepName?: PaymentTimelineStepName;
  eventId?: string;
  traceId?: string;
  requestId?: string;
  paymentId?: string;
  offerId?: string;
  reservationId?: string;
  redemptionId?: string;
  idempotencyKey?: string;
  /** Step duration in ms, from the backend's completed_step_time. Undefined when not yet received, null when the backend sent null. */
  stepTimeMs?: number | null;
  /** Raw JSON payload shown in the event inspector drawer */
  rawPayload?: Record<string, unknown>;
}

// ── Payment notification timeline (SSE) ───────────────────────────────────────
// Mirrors the backend's PaymentTimelineDTO pushed over
// GET /notification/timeline/{trace_id}.

export type NotificationStatus = "CREATED" | "PROCESSING" | "SUCCESS" | "FAILED";

export type PaymentTimelineStepName =
  | "PAYMENT_INITIATED"
  | "OFFER_EVALUATED"
  | "OFFER_RESERVED"
  | "PAYMENT_VALIDATED"
  | "ACCOUNTS_UPDATED"
  | "PAYMENT_PERSISTED"
  | "OUTBOX_EVENT_CREATED"
  | "KAFKA_PUBLISHED"
  | "TRANSACTIONS_COMPLETED"
  | "OFFER_REDEEMED"
  | "PROMO_POOL_DEBITED"
  | "CASHBACK_CREDITED"
  | "PAYMENT_COMPLETED";

export interface PaymentTimelineStepDTO {
  step_name: PaymentTimelineStepName;
  status: NotificationStatus;
  completed_time: string;
  completed_step_time: number | null;
}

export interface PaymentTimelineDTO {
  trace_id: string;
  payment_id: string;
  status: NotificationStatus;
  timeline_steps: PaymentTimelineStepDTO[];
  /** Total elapsed time in ms — only meaningful once status is SUCCESS or FAILED. */
  total_time: number | null;
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

export interface CompanyOffersSummary {
  activeOffers: number;
  totalOffers: number;
  totalRedemptions: number;
  budgetRemaining: number;
  initialBudget: number;
  avgConversionRate: number;
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

export interface UserInfoResponse {
  account_id: string;
  account_name: string;
  payment_handle: string;
  account_type: string;
  balance: number;
  currency: string;
  allow_negative_balance: boolean;
  user_id?: string | null;
  role?: string | null;
  company_id?: string | null;
  company_name?: string | null;
  company_business_name?: string | null;
}

export interface NavAccount {
  id: string;
  name: string;
  paymentHandle: string;
  type: "ACCOUNT" | "COMPANY";
  currency: Currency;
  balance: number;
  avatarInitials: string;
}

// Explicit company identity for the company dashboard / offer creation flow —
// kept separate from NavAccount so `companyId` can never be confused with a
// generic nav-switcher `id`.
export interface NavCompany {
  id: string;
  paymentHandle: string;
  companyId: string;
  companyName: string;
  businessName: string;
}

export interface ReceiverResult {
  id: string;
  name: string;
  accountId: string;
  paymentHandle: string;
  currency: Currency;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ── Payment Details page ──────────────────────────────────────────────────────

export type OfferRedemptionStatus = "REDEEMED" | "PENDING" | "FAILED";

export interface PaymentOfferDetails {
  code: string;
  type: OfferType;
  discountAmount: number;
  cashbackAmount: number;
  status: OfferRedemptionStatus;
  redeemedAt: Date | null;
}

export interface PaymentDetails {
  id: string;
  amount: number;
  currency: Currency;
  senderName: string;
  senderHandle: string;
  receiverName: string;
  receiverHandle: string;
  status: TxStatus;
  createdAt: Date;
  completedAt: Date | null;
  paymentMethod: string;
  offer: PaymentOfferDetails | null;
}

export type AccountingEntryType = "DEBIT" | "CREDIT";

export interface AccountingTransaction {
  id: string;
  category: AccountingEntryType;
  amount: number;
  currency: Currency;
  account: string;
  createdAt: Date;
}


export interface FlowpayMetricsDTO {
  payments_total: number;
  payments_success: number;
  payments_failed: number;
  payments_processing: number;

  offers_reserved: number;
  offers_redeemed: number;

  payments_today: number;

  kafka_status: "CONNECTED" | "DISCONNECTED";
  offer_service_status: "CONNECTED" | "DISCONNECTED";
  payment_service_status: "CONNECTED" | "DISCONNECTED";
}