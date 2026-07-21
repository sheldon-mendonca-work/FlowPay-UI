import { protectedAxios, ApiError, BACKEND_URL } from "@/axios/axiosSetup";
import type { ApiResponse } from "@/axios/axiosSetup";
import { getCachedAccessToken } from "@/store/authstore";
import type { FlowpayMetricsDTO, LiveActivityEvent } from "@/types/types";

interface RawActivityEvent {
  id: string;
  type: LiveActivityEvent["type"];
  amount?: number;
  currency?: string;
  from?: string;
  message: string;
  timestamp: string;
}

interface LiveFeedResponse {
  events: RawActivityEvent[];
}

// GET /accounts/livefeed/{id}
export async function fetchActivityFeed(
  accountId: string,
  signal?: AbortSignal,
): Promise<LiveActivityEvent[]> {
  const { data: envelope } = await protectedAxios.get<ApiResponse<LiveFeedResponse>>(
    `/accounts/livefeed/${accountId}`,
    { signal },
  );

  if (!envelope.success || envelope.code !== 200) {
    throw new ApiError(
      envelope.code.toString(),
      envelope.message ?? "Failed to fetch activity feed",
    );
  }

  return (envelope.data?.events ?? []).map((e) => ({
    id: e.id,
    type: e.type,
    amount: e.amount,
    currency: e.currency as LiveActivityEvent["currency"],
    from: e.from,
    message: e.message,
    timestamp: new Date(e.timestamp),
  }));
}


export function getFlowpayMetrics(
  onUpdate: (dto: FlowpayMetricsDTO) => void,
): () => void {
  const token = getCachedAccessToken();
  const url = new URL(`${BACKEND_URL}/notification/fp/metrics`);
  if (token) url.searchParams.set("token", token);

  const source = new EventSource(url);

  source.onmessage = (event) => {
    try {
      onUpdate(JSON.parse(event.data) as FlowpayMetricsDTO);
    } catch {
      // malformed frame — the next snapshot resyncs state
    }
  };

  return () => source.close();
}