import { protectedAxios, ApiError } from "@/axios/axiosSetup";
import type { ApiResponse } from "@/axios/axiosSetup";
import type { Currency, PaymentDetails, PaymentOfferDetails, TxStatus } from "@/types/types";

interface RawPaymentParty {
  id: string;
  name: string;
  payment_handle: string;
}

interface RawPaymentOffer {
  offer_code: string;
  offer_type: string;
  discount_amount: number;
  cashback_amount: number;
  status: string;
  redeemed_time: string | null;
}

interface RawPaymentDetails {
  payment_id: string;
  idempotency_key: string;
  sender: RawPaymentParty;
  receiver: RawPaymentParty;
  amount: number; // minor units, e.g. paise
  currency: string;
  payment_method: string;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  offer?: RawPaymentOffer | null;
}

function toOfferDetails(raw: RawPaymentOffer): PaymentOfferDetails {
  return {
    code: raw.offer_code,
    type: raw.offer_type as PaymentOfferDetails["type"],
    discountAmount: raw.discount_amount / 100,
    cashbackAmount: raw.cashback_amount / 100,
    status: raw.status as PaymentOfferDetails["status"],
    redeemedAt: raw.redeemed_time ? new Date(raw.redeemed_time) : null,
  };
}

// GET /payments/{paymentId}
export async function fetchPaymentDetails(
  paymentId: string,
  signal?: AbortSignal,
): Promise<PaymentDetails> {
  const { data: envelope } = await protectedAxios.get<ApiResponse<RawPaymentDetails>>(
    `/payments/${paymentId}`,
    { signal },
  );

  if (!envelope.success || envelope.code !== 200) {
    throw new ApiError(
      envelope.code.toString(),
      envelope.message ?? "Failed to fetch payment details",
    );
  }

  const raw = envelope.data;
  return {
    id: raw.payment_id,
    amount: raw.amount / 100,
    currency: raw.currency as Currency,
    senderName: raw.sender.name,
    senderHandle: raw.sender.payment_handle,
    receiverName: raw.receiver.name,
    receiverHandle: raw.receiver.payment_handle,
    status: raw.status as TxStatus,
    createdAt: new Date(raw.created_at),
    completedAt: raw.completed_at ? new Date(raw.completed_at) : null,
    paymentMethod: raw.payment_method,
    offer: raw.offer ? toOfferDetails(raw.offer) : null,
  };
}
