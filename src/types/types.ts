export type OfferType = "DISCOUNT" | "CASHBACK";
export type OfferStatus = "ACTIVE" | "EXHAUSTED" | "EXPIRED";
export type TxStatus = "COMPLETED" | "PENDING" | "FAILED" | "PROCESSING";
export type TimelineStepState = "pending" | "processing" | "success" | "failed";
export type Currency = "INR" | "INR" | "GBP";

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
  currency: Currency;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
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
