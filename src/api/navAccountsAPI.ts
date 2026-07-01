import { protectedAxios, ApiError } from "@/axios/axiosSetup";
import type { ApiResponse } from "@/axios/axiosSetup";
import type { NavAccount, NavCompany } from "@/types/types";

interface RawAccount {
  account_id: string;
  name?: string;
  account_name?: string;
  business_name?: string;
  currency: string;
  balance?: number;
  company_id?: string;
  payment_handle: string;
}

function deriveInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function toNavAccount(raw: RawAccount): NavAccount {
  const name = raw?.name || raw?.account_name || raw?.business_name || '';
  return {
    id: raw.account_id,
    name,
    paymentHandle: raw.payment_handle,
    type: "ACCOUNT",
    currency: raw.currency as NavAccount["currency"],
    balance: raw.balance ?? 0,
    avatarInitials: deriveInitials(name),
  };
}

function toNavCompany(raw: RawAccount): NavCompany {
  const businessName = raw?.business_name || raw?.name || raw?.account_name || '';
  return {
    id: raw.account_id,
    paymentHandle: raw.payment_handle,
    companyId: raw.company_id ?? raw.account_id,
    companyName: raw.name || raw.business_name || raw.account_name || '',
    businessName,
  };
}

// POST /defaults/list { type: "accounts" }
async function fetchConsumerNavList(): Promise<NavAccount[]> {
  const { data: envelope } = await protectedAxios.post<
    ApiResponse<{ accounts: RawAccount[] }>
  >("/accounts/defaults/list", { type: "accounts" });

  if (!envelope.success || envelope.code !== 200) {
    throw new ApiError(
      envelope.code.toString(),
      envelope.message ?? "Failed to fetch accounts list",
    );
  }
  return (envelope.data?.accounts ?? []).map(toNavAccount);
}

// GET /accounts/defaults/companies
async function fetchCompanyNavList(): Promise<NavCompany[]> {
  const { data: envelope } = await protectedAxios.get<
    ApiResponse<{ companies: RawAccount[] }>
  >("/accounts/defaults/companies");

  if (!envelope.success || envelope.code !== 200) {
    throw new ApiError(
      envelope.code.toString(),
      envelope.message ?? "Failed to fetch companies list",
    );
  }
  return (envelope.data?.companies ?? []).map(toNavCompany);
}

export function fetchNavAccounts(type: "ACCOUNT"): Promise<NavAccount[]>;
export function fetchNavAccounts(type: "COMPANY"): Promise<NavCompany[]>;
export function fetchNavAccounts(type: "ACCOUNT" | "COMPANY"): Promise<NavAccount[] | NavCompany[]> {
  return type === "ACCOUNT" ? fetchConsumerNavList() : fetchCompanyNavList();
}
