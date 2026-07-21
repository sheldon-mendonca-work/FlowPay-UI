import { BACKEND_URL, protectedAxios, ApiError } from "@/axios/axiosSetup";
import { getCachedAccessToken } from "@/store/authstore";
import type { ApiResponse } from "@/axios/axiosSetup";
import type { PaymentTimelineDTO } from "@/types/types";

// GET /notification/timeline/payment/{paymentId} — one-shot historical snapshot
// for the Payment Details page (as opposed to the live SSE stream below).
export async function fetchPaymentTimeline(
  paymentId: string,
  signal?: AbortSignal,
): Promise<PaymentTimelineDTO> {
  const { data: envelope } = await protectedAxios.get<ApiResponse<PaymentTimelineDTO>>(
    `/notification/timeline/payment/${paymentId}`,
    { signal },
  );

  if (!envelope.success || envelope.code !== 200) {
    throw new ApiError(
      envelope.code.toString(),
      envelope.message ?? "Failed to fetch payment timeline",
    );
  }

  return envelope.data;
}

// GET /notification/timeline/{trace_id} (SSE) — server pushes a full
// PaymentTimelineDTO snapshot on connect and again after every step update,
// plus periodic ": heartbeat" comments the browser's EventSource ignores.
// Returns an unsubscribe function; the browser auto-reconnects on drop.
// Native EventSource can't send an Authorization header, so the access
// token rides along as a query param instead.
export function subscribeToPaymentTimeline(
  traceId: string,
  onUpdate: (dto: PaymentTimelineDTO) => void,
): () => void {
  const token = getCachedAccessToken();
  const url = new URL(`${BACKEND_URL}/notification/timeline/${traceId}`);
  if (token) url.searchParams.set("token", token);

  const source = new EventSource(url);

  source.onmessage = (event) => {
    try {
      onUpdate(JSON.parse(event.data) as PaymentTimelineDTO);
    } catch {
      // malformed frame — the next snapshot resyncs state
    }
  };

  return () => source.close();
}
