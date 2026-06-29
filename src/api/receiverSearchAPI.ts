import { protectedAxios, ApiError } from "@/axios/axiosSetup";
import type { ApiResponse } from "@/axios/axiosSetup";
import type { ReceiverResult, PaginatedResult } from "@/types/types";

interface RawAccount {
  account_id: string;
  account_name: string;
  currency: string;
}

interface AccountListResponse {
  accounts: RawAccount[];
  total: number;
  page: number;
  page_size: number;
}

const PAGE_SIZE = 5;

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
      accountId: a.account_id,
      currency: a.currency as ReceiverResult["currency"],
    })),
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
}
