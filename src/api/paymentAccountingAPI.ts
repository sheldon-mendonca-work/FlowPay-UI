import { protectedAxios, ApiError } from "@/axios/axiosSetup";
import type { ApiResponse } from "@/axios/axiosSetup";
import type { AccountingTransaction, Currency } from "@/types/types";

interface RawAccountingTransaction {
  transaction_id: string;
  transaction_category: "DEBIT" | "CREDIT";
  amount: number; // minor units, e.g. paise
  currency: string;
  account: string;
  created_at: string;
}

interface AccountingTransactionsResponse {
  transactions: RawAccountingTransaction[];
}

// GET /accounts/transactions/{paymentId}
export async function fetchPaymentAccountingTransactions(
  paymentId: string,
  signal?: AbortSignal,
): Promise<AccountingTransaction[]> {
  const { data: envelope } = await protectedAxios.get<ApiResponse<AccountingTransactionsResponse>>(
    `/accounts/transactions/payment/${paymentId}`,
    { signal },
  );

  if (!envelope.success || envelope.code !== 200) {
    throw new ApiError(
      envelope.code.toString(),
      envelope.message ?? "Failed to fetch accounting transactions",
    );
  }

  const raw = envelope.data?.transactions ?? [];
  return raw.map((tx) => ({
    id: tx.transaction_id,
    category: tx.transaction_category,
    amount: tx.amount / 100,
    currency: tx.currency as Currency,
    account: tx.account,
    createdAt: new Date(tx.created_at),
  }));
}
