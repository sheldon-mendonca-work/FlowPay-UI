import axios from "axios";
import { protectedAxios, ApiError } from "@/axios/axiosSetup";
import type { ApiResponse } from "@/axios/axiosSetup";
import type { ReceiverResult, PaginatedResult } from "@/types/types";

interface RawAccount {
  account_id: string;
  account_name: string;
  payment_handle: string;
  currency: string;
}

interface AccountListResponse {
  accounts: RawAccount[];
  total: number;
  page: number;
  page_size: number;
}

const PAGE_SIZE = 5;

interface RawPaymentHandleAccount {
  user_id?: string | null;
  account_id: string;
  role?: string | null;
  account_name: string;
  payment_handle: string;
  account_type: string;
  balance: number;
  currency: string;
  company_id?: string | null;
  company_name?: string | null;
  company_business_name?: string | null;
}

// GET /accounts/paymenthandle/:paymenthandle
// Throws ApiError("404", ...) when the handle doesn't resolve to an account.
export async function fetchAccountByPaymentHandle(
  paymentHandle: string,
  signal?: AbortSignal,
): Promise<ReceiverResult> {
  let envelope: ApiResponse<RawPaymentHandleAccount>;
  try {
    const res = await protectedAxios.get<ApiResponse<RawPaymentHandleAccount>>(
      `/accounts/paymenthandle/${encodeURIComponent(paymentHandle)}`,
      { signal },
    );
    envelope = res.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      throw new ApiError("404", "User not found");
    }
    throw err;
  }

  if (!envelope.success || envelope.code !== 200) {
    throw new ApiError(
      envelope.code.toString(),
      envelope.message ?? "User not found",
    );
  }

  const raw = envelope.data;
  return {
    id: raw.account_id,
    name: raw.account_name,
    accountId: raw.account_id,
    paymentHandle: raw.payment_handle,
    currency: raw.currency as ReceiverResult["currency"],
  };
}

// POST /accounts/list { search, page, page_size }
export async function searchReceivers(
  query: string,
  page: number = 1,
  pageSize: number = PAGE_SIZE,
): Promise<PaginatedResult<ReceiverResult>> {
  const { data: envelope } = await protectedAxios.post<ApiResponse<AccountListResponse>>(
    "/accounts/list",
    { search: query, page, page_size: pageSize },
  );

  if (!envelope.success || envelope.code !== 200) {
    throw new ApiError(
      envelope.code.toString(),
      envelope.message ?? "Failed to search accounts",
    );
  }

  const accounts = envelope.data?.accounts ?? [];
  const total = envelope.data?.total ?? accounts.length;

  return {
    items: accounts.map((a) => ({
      id: a.account_id,
      name: a.account_name,
      paymentHandle: a.payment_handle,
      accountId: a.account_id,
      currency: a.currency as ReceiverResult["currency"],
    })),
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
}
