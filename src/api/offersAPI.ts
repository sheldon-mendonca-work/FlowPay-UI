import { protectedAxios, ApiError } from "@/axios/axiosSetup";
import type { ApiResponse } from "@/axios/axiosSetup";
import type { Offer, OfferType, OfferStatus } from "@/types/types";

interface RawOffer {
  id: string;
  code: string;
  type: string;
  benefit_amount: number;
  min_payment_amount: number;
  remaining_budget: number;
  total_budget: number;
  status: string;
  description: string;
}

function toOffer(r: RawOffer): Offer {
  return {
    id: r.id,
    code: r.code,
    type: r.type as OfferType,
    benefitAmount: r.benefit_amount,
    minPaymentAmount: r.min_payment_amount,
    remainingBudget: r.remaining_budget,
    totalBudget: r.total_budget,
    status: r.status as OfferStatus,
    description: r.description,
  };
}

// POST /offers/list {}
export async function fetchOffers(): Promise<Offer[]> {
  const { data: envelope } = await protectedAxios.post<ApiResponse<{ offers: RawOffer[] }>>(
    "/offers/list",
    {},
  );
  if (!envelope.success || envelope.code !== 200) {
    throw new ApiError(envelope.code.toString(), envelope.message ?? "Failed to fetch offers");
  }
  return (envelope.data?.offers ?? []).map(toOffer);
}
