import { protectedAxios, ApiError } from "@/axios/axiosSetup";
import type { ApiResponse } from "@/axios/axiosSetup";
import type { Transaction, PaginatedResult, TxStatus } from "@/types/types";

interface RawTransaction {
  transaction_id: string;
  payment_id: string;
  type: string;
  transaction_category: "DEBIT" | "CREDIT";
  amount: number; // minor units, e.g. paise
  currency: string;
  status: TxStatus;
  created_at: string;
}

interface TransactionListResponse {
  transactions: RawTransaction[];
  total: number;
  page: number;
  page_size: number;
}

const PAGE_SIZE = 5;

// No counterparty name on the wire yet — fall back to a readable transaction type.
function humanizeType(type: string): string {
  return type
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// GET /accounts/transactions/{accountID}?page=x&size=y
export async function fetchTransactions(
  accountId: string,
  page: number = 1,
  pageSize: number = PAGE_SIZE,
  signal?: AbortSignal,
): Promise<PaginatedResult<Transaction>> {
  const { data: envelope } = await protectedAxios.get<ApiResponse<TransactionListResponse>>(
    `/accounts/transactions/${accountId}`,
    { params: { page, size: pageSize }, signal },
  );

  if (!envelope.success || envelope.code !== 200) {
    throw new ApiError(
      envelope.code.toString(),
      envelope.message ?? "Failed to fetch transactions",
    );
  }

  const raw = envelope.data?.transactions ?? [];
  const total = envelope.data?.total ?? raw.length;

  return {
    items: raw.map((tx) => ({
      id: tx.transaction_id,
      paymentId: tx.payment_id,
      time: new Date(tx.created_at),
      counterparty: humanizeType(tx.type),
      amount: tx.amount / 100,
      currency: tx.currency as Transaction["currency"],
      status: tx.status,
      direction: tx.transaction_category === "DEBIT" ? "out" : "in",
    })),
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
}
