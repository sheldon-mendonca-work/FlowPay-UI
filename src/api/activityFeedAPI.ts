import type { LiveActivityEvent } from "@/types/types";

const now = Date.now();
const minsAgo = (m: number) => new Date(now - m * 60_000);

const DUMMY_ACTIVITY: LiveActivityEvent[] = [
  {
    id: "feed-act-1",
    type: "payment_received",
    amount: 250.00,
    currency: "INR",
    from: "Sam Rivera",
    message: "Payment received from Sam Rivera",
    timestamp: minsAgo(2),
  },
  {
    id: "feed-act-2",
    type: "cashback_received",
    amount: 12.50,
    currency: "INR",
    message: "Cashback credited from SAVE10 offer",
    timestamp: minsAgo(5),
  },
  {
    id: "feed-act-3",
    type: "offer_redeemed",
    message: "Offer SAVE10 redeemed successfully",
    timestamp: minsAgo(8),
  },
  {
    id: "feed-act-4",
    type: "payment_received",
    amount: 1_200.00,
    currency: "INR",
    from: "Alex Chen",
    message: "Payment received from Alex Chen",
    timestamp: minsAgo(35),
  },
  {
    id: "feed-act-5",
    type: "refund_received",
    amount: 45.00,
    currency: "INR",
    message: "Refund processed for order #4521",
    timestamp: minsAgo(120),
  },
  {
    id: "feed-act-6",
    type: "payment_received",
    amount: 800.00,
    currency: "INR",
    from: "Jordan Blake",
    message: "Payment received from Jordan Blake",
    timestamp: minsAgo(240),
  },
];

// POST /activity/feed { accountId }
export async function fetchActivityFeed(_accountId: string): Promise<LiveActivityEvent[]> {
  // TODO: replace with protectedAxios.post('/activity/feed', { accountId: _accountId })
  return DUMMY_ACTIVITY;
}
