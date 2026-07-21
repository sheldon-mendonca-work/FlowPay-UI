import { protectedAxios, ApiError } from "@/axios/axiosSetup";
import type { ApiResponse } from "@/axios/axiosSetup";

export interface AccountBalance {
  balance: number;
  currency: string;
}

// Balance is minor units (e.g. paise) on the wire.
interface RawAccountBalance {
  balance: number;
  currency: string;
}

// GET /accounts/balance/{id}
export async function fetchAccountBalance(
  accountId: string,
  signal?: AbortSignal,
): Promise<AccountBalance> {
  const { data: envelope } = await protectedAxios.get<ApiResponse<RawAccountBalance>>(
    `/accounts/balance/${accountId}`,
    { signal },
  );

  if (!envelope.success || envelope.code !== 200) {
    throw new ApiError(
      envelope.code.toString(),
      envelope.message ?? "Failed to fetch account balance",
    );
  }

  const raw = envelope.data;
  return {
    balance: raw.balance / 100,
    currency: raw.currency,
  };
}
