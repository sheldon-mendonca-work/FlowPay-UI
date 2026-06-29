import type { Transaction, PaginatedResult } from "@/types/types";

const now = Date.now();
const minsAgo = (m: number) => new Date(now - m * 60_000);

const DUMMY_TRANSACTIONS: Transaction[] = [
  { id: "tx-r1",  time: minsAgo(2),    counterparty: "Sam Rivera",   amount: 250.00,    currency: "INR", status: "COMPLETED",  direction: "in" },
  { id: "tx-r2",  time: minsAgo(8),    counterparty: "Alex Chen",    amount: 1_200.00,  currency: "INR", status: "COMPLETED",  direction: "in" },
  { id: "tx-r3",  time: minsAgo(25),   counterparty: "Jordan Blake", amount: 75.50,     currency: "INR", status: "COMPLETED",  direction: "in" },
  { id: "tx-r4",  time: minsAgo(60),   counterparty: "Merchant XYZ", amount: 120.00,    currency: "INR", status: "COMPLETED",  direction: "out" },
  { id: "tx-r5",  time: minsAgo(120),  counterparty: "Jordan Blake", amount: 800.00,    currency: "INR", status: "COMPLETED",  direction: "in" },
  { id: "tx-r6",  time: minsAgo(180),  counterparty: "Service Co",   amount: 45.00,     currency: "INR", status: "PROCESSING", direction: "out" },
  { id: "tx-r7",  time: minsAgo(300),  counterparty: "Sam Rivera",   amount: 350.00,    currency: "INR", status: "COMPLETED",  direction: "in" },
  { id: "tx-r8",  time: minsAgo(480),  counterparty: "Alex Chen",    amount: 90.00,     currency: "INR", status: "FAILED",     direction: "out" },
  { id: "tx-r9",  time: minsAgo(720),  counterparty: "GloboPay",     amount: 2_200.00,  currency: "INR", status: "COMPLETED",  direction: "in" },
  { id: "tx-r10", time: minsAgo(1080), counterparty: "Sam Rivera",   amount: 150.00,    currency: "INR", status: "COMPLETED",  direction: "in" },
  { id: "tx-r11", time: minsAgo(1440), counterparty: "Vendor A",     amount: 600.00,    currency: "INR", status: "COMPLETED",  direction: "out" },
  { id: "tx-r12", time: minsAgo(1800), counterparty: "Alex Chen",    amount: 425.00,    currency: "INR", status: "PENDING",    direction: "in" },
  { id: "tx-r13", time: minsAgo(2160), counterparty: "Jordan Blake", amount: 1_100.00,  currency: "INR", status: "COMPLETED",  direction: "in" },
  { id: "tx-r14", time: minsAgo(2880), counterparty: "Platform Fee", amount: 25.00,     currency: "INR", status: "COMPLETED",  direction: "out" },
  { id: "tx-r15", time: minsAgo(4320), counterparty: "Sam Rivera",   amount: 500.00,    currency: "INR", status: "COMPLETED",  direction: "in" },
];

const PAGE_SIZE = 5;

// POST /transactions/list { accountId, page, pageSize }
export async function fetchTransactions(
  _accountId: string,
  page: number = 1,
  pageSize: number = PAGE_SIZE,
): Promise<PaginatedResult<Transaction>> {
  // TODO: replace with protectedAxios.post('/transactions/list', { accountId: _accountId, page, pageSize })
  const start = (page - 1) * pageSize;
  const items = DUMMY_TRANSACTIONS.slice(start, start + pageSize);
  return {
    items,
    total: DUMMY_TRANSACTIONS.length,
    page,
    pageSize,
    hasMore: start + pageSize < DUMMY_TRANSACTIONS.length,
  };
}
