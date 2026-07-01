import { protectedAxios, ApiError } from "@/axios/axiosSetup";
import type { ApiResponse } from "@/axios/axiosSetup";
import type { CompanyOffer, CompanyOffersSummary, OfferType, OfferStatus, OfferFundingStatus } from "@/types/types";
import { useAuthStore } from "@/store/authstore";
import type { OfferFormState } from "@/components/create-offer-dialog";

export const companyOffersQueryKey = (companyId: string) => ["companyOffers", companyId] as const;
export const companyOffersSummaryQueryKey = (companyId: string) => ["companyOffersSummary", companyId] as const;

interface RawCompanyOffer {
  id: string;
  code: string;
  type: string;
  benefit_amount: number;
  is_percentage: boolean;
  max_benefit: number;
  min_payment_amount: number;
  max_payment_amount: number | null;
  max_redemptions: number;
  per_user_limit: number;
  start_time: string;
  end_time: string;
  promotion_pool_name: string;
  initial_budget: number;
  remaining_budget: number;
  total_redemptions: number;
  conversion_rate: number;
  status: string;
  funding_status: string;
  created_at: string;
}

interface RawCompanyOffersSummary {
  active_offers: number;
  total_offers: number;
  total_redemptions: number;
  budget_remaining: number;
  initial_budget: number;
  avg_conversion_rate: number;
}

function toCompanyOffer(r: RawCompanyOffer): CompanyOffer {
  return {
    id: r.id,
    code: r.code,
    type: r.type as OfferType,
    benefitAmount: r.benefit_amount,
    isPercentage: r.is_percentage,
    maxBenefit: r.max_benefit,
    minPaymentAmount: r.min_payment_amount,
    maxPaymentAmount: r.max_payment_amount,
    maxRedemptions: r.max_redemptions,
    perUserLimit: r.per_user_limit,
    startTime: new Date(r.start_time),
    endTime: new Date(r.end_time),
    promotionPoolName: r.promotion_pool_name,
    initialBudget: r.initial_budget,
    remainingBudget: r.remaining_budget,
    totalRedemptions: r.total_redemptions,
    conversionRate: r.conversion_rate,
    status: r.status as OfferStatus,
    fundingStatus: r.funding_status as OfferFundingStatus,
    createdAt: new Date(r.created_at),
  };
}

function toCompanyOffersSummary(r: RawCompanyOffersSummary): CompanyOffersSummary {
  return {
    activeOffers: r.active_offers,
    totalOffers: r.total_offers,
    totalRedemptions: r.total_redemptions,
    budgetRemaining: r.budget_remaining,
    initialBudget: r.initial_budget,
    avgConversionRate: r.avg_conversion_rate,
  };
}

// POST /companies/offers { company_id }
export async function fetchCompanyOffers(companyId: string): Promise<CompanyOffer[]> {
  const { data: envelope } = await protectedAxios.post<ApiResponse<{ offers: RawCompanyOffer[] }>>(
    "/offers/companies",
    { company_id: companyId },
  );
  if (!envelope.success || envelope.code !== 200) {
    throw new ApiError(envelope.code.toString(), envelope.message ?? "Failed to fetch company offers");
  }
  return (envelope.data?.offers ?? []).map(toCompanyOffer);
}

// GET /offers/:offerId
export async function fetchOfferById(offerId: string): Promise<CompanyOffer> {
  const { data: envelope } = await protectedAxios.get<ApiResponse<RawCompanyOffer>>(
    `/offers/${offerId}`,
  );
  if (!envelope.success || envelope.code !== 200) {
    throw new ApiError(envelope.code.toString(), envelope.message ?? "Failed to fetch offer");
  }
  return toCompanyOffer(envelope.data);
}

// POST /offers
export async function createOffer(companyId: string, form: OfferFormState, idempotencyKey: string): Promise<CompanyOffer> {
  const { userInfo } = useAuthStore.getState();
  const createdBy = userInfo?.user_id ?? userInfo?.account_id ?? "";

  const body = {
    offer_code: form.code,
    offer_type: form.type,
    created_by: createdBy,
    company_id: companyId,
    offer_amount: form.isPercentage ? null : Math.round(parseFloat(form.benefitAmount) || 0),
    offer_percentage: form.isPercentage ? Math.round(parseFloat(form.benefitAmount) || 0) : null,
    max_benefit_amount: Math.round(parseFloat(form.maxBenefit) || 0),
    min_payment_amount: Math.round(parseFloat(form.minPaymentAmount) || 0),
    max_payment_amount: form.maxPaymentAmount ? Math.round(parseFloat(form.maxPaymentAmount)) : null,
    max_redemptions_per_user: parseInt(form.perUserLimit) || 0,
    max_redemptions: parseInt(form.maxRedemptions) || 0,
    budget_amount: form.initialBudget ? Math.round(parseFloat(form.initialBudget)) : null,
    start_time: new Date(form.startTime).toISOString(),
    end_time: new Date(form.endTime).toISOString(),
  };

  const { data: envelope } = await protectedAxios.post<ApiResponse<{ offer_id: string }>>(
    "/offers",
    body,
    { idempotencyKey },
  );
  if (!envelope.success || envelope.code !== 200) {
    throw new ApiError(envelope.code.toString(), envelope.message ?? "Failed to create offer");
  }

  return fetchOfferById(envelope.data.offer_id);
}

// POST /companies/offers/summary { company_id }
export async function fetchCompanyOffersSummary(companyId: string): Promise<CompanyOffersSummary> {
  const { data: envelope } = await protectedAxios.post<ApiResponse<RawCompanyOffersSummary>>(
    "/offers/companies/summary",
    { company_id: companyId },
  );
  if (!envelope.success || envelope.code !== 200) {
    throw new ApiError(envelope.code.toString(), envelope.message ?? "Failed to fetch offers summary");
  }
  return toCompanyOffersSummary(envelope.data);
}
