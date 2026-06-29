import { protectedAxios, ApiError } from "@/axios/axiosSetup";
import type { ApiResponse } from "@/axios/axiosSetup";
import type { NavAccount } from "@/types/types";

interface RawAccount {
  account_id: string;
  account_name: string;
  currency: string;
  balance?: number;
  display_name?: string;
}

function toNavAccount(raw: RawAccount, type: "ACCOUNT" | "COMPANY"): NavAccount {
  const name = raw.display_name || raw.account_name;
  return {
    id: raw.account_id,
    name,
    accountId: raw.account_id,
    type,
    currency: raw.currency as NavAccount["currency"],
    balance: raw.balance ?? 0,
    avatarInitials: name
      .split(" ")
      .map((w) => w[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2),
  };
}

// POST /defaults/list { type: "accounts" }
async function fetchConsumerNavList(): Promise<NavAccount[]> {
  const { data: envelope } = await protectedAxios.post<
    ApiResponse<{ accounts: RawAccount[] }>
  >("/defaults/list", { type: "accounts" });

  if (!envelope.success || envelope.code !== 200) {
    throw new ApiError(
      envelope.code.toString(),
      envelope.message ?? "Failed to fetch accounts list",
    );
  }
  return (envelope.data?.accounts ?? []).map((a) => toNavAccount(a, "ACCOUNT"));
}

// GET /accounts/defaults/companies
async function fetchCompanyNavList(): Promise<NavAccount[]> {
  const { data: envelope } = await protectedAxios.get<
    ApiResponse<{ companies: RawAccount[] }>
  >("/accounts/defaults/companies");

  if (!envelope.success || envelope.code !== 200) {
    throw new ApiError(
      envelope.code.toString(),
      envelope.message ?? "Failed to fetch companies list",
    );
  }
  return (envelope.data?.companies ?? []).map((c) => toNavAccount(c, "COMPANY"));
}

export async function fetchNavAccounts(type: "ACCOUNT" | "COMPANY"): Promise<NavAccount[]> {
  return type === "ACCOUNT" ? fetchConsumerNavList() : fetchCompanyNavList();
}
