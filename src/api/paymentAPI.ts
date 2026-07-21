import { protectedAxios } from "@/axios/axiosSetup";
import type { ApiResponse } from "@/axios/axiosSetup";

export interface PaymentRequestDTO {
  sender_id: string;
  receiver_id: string;
  amount: number; // minor units, e.g. paise
  currency: string;
  offer_id: string;
}

// POST /payments
export async function submitPayment(
  dto: PaymentRequestDTO,
  traceId: string,
  idempotencyKey: string,
): Promise<ApiResponse<unknown>> {
  const { data } = await protectedAxios.post<ApiResponse<unknown>>("/payments", dto, {
    traceId,
    idempotencyKey,
  });
  return data;
}
