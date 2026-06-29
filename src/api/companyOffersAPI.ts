import type { CompanyOffer } from "@/types/types";
import { COMPANY_OFFERS } from "@/lib/mock-data";

// GET /companies/:companyId/offers
export async function fetchCompanyOffers(_companyId: string): Promise<CompanyOffer[]> {
  // TODO: replace with protectedAxios.get(`/companies/${_companyId}/offers`)
  return COMPANY_OFFERS;
}
