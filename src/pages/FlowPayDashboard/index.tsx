import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, CreditCard, Server } from "lucide-react";
import { TopNav } from "@/components/top-nav";
import { SenderColumn } from "@/components/sender-column";
import { CenterColumn } from "@/components/center-column";
import { ReceiverColumn } from "@/components/receiver-column";
import { CompanyDashboard } from "@/components/company-dashboard";
import { WelcomeOverlay } from "@/components/welcome-overlay";
import { ReadmeDialog } from "@/components/readme-dialog";
import { ArchitectureDialog } from "@/components/architecture-dialog";
import { PaymentDetailsModal } from "@/components/payment-details/payment-details-modal";
import {
  buildTimelineSteps,
  mergeTimelineSnapshot,
  isTimelineFailed,
  isTimelineComplete,
  generateId,
  generateIdempotencyKey,
} from "@/lib/timeline-utils";
import { fetchNavAccounts } from "@/api/navAccountsAPI";
import { fetchOffers } from "@/api/offersAPI";
import { submitPayment } from "@/api/paymentAPI";
import { subscribeToPaymentTimeline } from "@/api/paymentTimelineAPI";
import { getFlowpayMetrics } from "@/api/activityFeedAPI";
import { fetchAccountBalance } from "@/api/accountBalanceAPI";
import { fetchTransactions } from "@/api/transactionsAPI";
import { useAuthStore } from "@/store/authstore";
import type {
  User,
  Currency,
  Transaction,
  TimelineStep,
  LiveActivityEvent,
  NavAccount,
  ReceiverResult,
  NavCompany,
  Offer,
  FlowpayMetricsDTO,
} from "@/types/types";

// Safety net: if a trace hasn't reached PAYMENT_COMPLETED within this window
// (SSE drop, missed event, etc.), refresh account data anyway.
const PAYMENT_SETTLE_TIMEOUT_MS = 30_000;

function promoteToFront<T extends { id: string }>(list: T[], id: string): T[] {
  const idx = list.findIndex((item) => item.id === id);
  if (idx <= 1) return list; // already visible
  const item = list[idx];
  return [item, ...list.filter((i) => i.id !== id)];
}

function deriveInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

type Theme   = "light" | "dark";
type AppMode = "consumer" | "company";

export default function FlowPayDashboard() {
  const navigate = useNavigate();

  // ── Auth / sender identity ─────────────────────────────────────────────
  const userInfo = useAuthStore((s) => s.userInfo);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setUserInfo = useAuthStore((s) => s.setUserInfo);


  const handleLogout = useCallback(() => {
    clearAuth();
    navigate("/", { replace: true });
  }, [clearAuth, navigate]);

  const senderUser: User = useMemo(() => {
    if (!userInfo) {
      // ProtectedRoute guarantees userInfo is set before we render; this is a type-safe fallback
      return { id: "", paymentHandle: "", name: "Loading…", avatarInitials: "…", balance: 0, currency: "INR" };
    }
    return {
      id: userInfo.account_id,
      paymentHandle: userInfo.payment_handle,
      name: userInfo.account_name,
      avatarInitials: deriveInitials(userInfo.account_name),
      balance: userInfo.balance,
      currency: userInfo.currency as Currency,
    };
  }, [userInfo]);

  // ── Theme ─────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem("flowpay_theme") as Theme | null;
    const initial = saved ?? "light";
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  function toggleTheme() {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("flowpay_theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }

  // ── App mode ──────────────────────────────────────────────────────────
  const [appMode, setAppMode] = useState<AppMode>("consumer");

  // ── Modals ────────────────────────────────────────────────────────────
  const [readmeOpen, setReadmeOpen] = useState(false);
  const [archOpen, setArchOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  // ── Nav accounts (right panel) / companies (company dashboard) ─────────
  const [navAccountsOrdered, setNavAccountsOrdered] = useState<NavAccount[]>([]);
  const [companiesOrdered, setCompaniesOrdered] = useState<NavCompany[]>([]);
  const [selectedNavId, setSelectedNavId] = useState<string>("");

  // ── Offers ────────────────────────────────────────────────────────────
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    fetchOffers().then(setOffers);
  }, []);

  // Fetch nav accounts / companies when appMode changes
  useEffect(() => {
    if (appMode === "consumer") {
      fetchNavAccounts("ACCOUNT").then((accounts) => {
        setNavAccountsOrdered(accounts);
        setSelectedNavId(accounts[0]?.id ?? "");
      });
    } else {
      fetchNavAccounts("COMPANY").then((companies) => {
        setCompaniesOrdered(companies);
        setSelectedNavId(companies[0]?.id ?? "");
      });
    }
  }, [appMode]);

  // Promote-to-front when a "More" entry is selected
  function handleNavAccountSelect(id: string) {
    setSelectedNavId(id);
    if (appMode === "consumer") {
      setNavAccountsOrdered((prev) => promoteToFront(prev, id));
    } else {
      setCompaniesOrdered((prev) => promoteToFront(prev, id));
    }
  }

  const selectedNavAccount = navAccountsOrdered.find((a) => a.id === selectedNavId);
  const selectedCompany = companiesOrdered.find((c) => c.id === selectedNavId);

  // Minimal shape the top nav switcher needs, regardless of mode
  const navSwitcherItems = appMode === "consumer" ? navAccountsOrdered : companiesOrdered.map((c) => ({
    id: c.id,
    name: c.companyName,
    paymentHandle: c.paymentHandle,
  }));

  // ── Payment receiver (independent of nav) ────────────────────────────
  const [paymentReceiver, setPaymentReceiver] = useState<ReceiverResult | null>(null);

  // ── Consumer payment state ────────────────────────────────────────────
  const [senderTxs, setSenderTxs] = useState<Transaction[]>([]);

  // Bumped after a payment settles (or times out) so each side self-fetches
  // its own fresh balance/transactions.
  const [senderRefreshTick, setSenderRefreshTick] = useState(0);
  const [receiverRefreshTick, setReceiverRefreshTick] = useState(0);

  const senderId = senderUser.id;
  useEffect(() => {
    if (!senderId) return;
    fetchAccountBalance(senderId)
      .then((bal) => {
        const info = useAuthStore.getState().userInfo;
        if (info) setUserInfo({ ...info, balance: bal.balance });
      })
      .catch((err) => console.error("Failed to refresh sender balance:", err));

    fetchTransactions(senderId, 1)
      .then((res) => setSenderTxs(res.items))
      .catch((err) => console.error("Failed to refresh sender transactions:", err));
  }, [senderRefreshTick, senderId, setUserInfo]);

  const [timelineSteps, setTimelineSteps] = useState<TimelineStep[]>([]);
  const [totalTimeMs, setTotalTimeMs] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // New activity events produced by the payment flow; fed into ReceiverColumn
  const [newActivityEvents, setNewActivityEvents] = useState<LiveActivityEvent[]>([]);

  // Live platform metrics (payment/offer counts, service connectivity) pushed
  // over SSE — drives the TopNav health stats/statuses and CenterColumn stat tiles.
  const [metrics, setMetrics] = useState<FlowpayMetricsDTO | null>(null);
  useEffect(() => {
    const unsubscribe = getFlowpayMetrics(setMetrics);
    return unsubscribe;
  }, []);

  const handleSendPayment = useCallback(
    (amount: number, _receiverId: string, offerId: string | null) => {
      if (isProcessing || !paymentReceiver) return;

      const offer = offers.find((o) => o.id === offerId) ?? null;
      const skeleton = buildTimelineSteps(offer);

      setIsProcessing(true);
      setTimelineSteps(skeleton);
      setTotalTimeMs(null);
      setNewActivityEvents([]);

      const traceId        = generateId("trc");
      const idempotencyKey = generateIdempotencyKey();

      const cashbackAmount =
        offer?.type === "CASHBACK"
          ? offer.benefitAmount >= 20
            ? offer.benefitAmount
            : amount * (offer.benefitAmount / 100)
          : undefined;

      const discountAmount =
        offer?.type === "DISCOUNT"
          ? offer.benefitAmount < 20
            ? amount * (offer.benefitAmount / 100)
            : offer.benefitAmount
          : 0;

      const netPayment = amount - discountAmount;
      const receiver = paymentReceiver;

      // Show the receiver's wallet on the right immediately so its refresh is visible.
      setNavAccountsOrdered((prev) => {
        if (prev.some((a) => a.id === receiver.accountId)) return promoteToFront(prev, receiver.accountId);
        const synthesized: NavAccount = {
          id: receiver.accountId,
          name: receiver.name,
          paymentHandle: receiver.paymentHandle,
          type: "ACCOUNT",
          currency: receiver.currency,
          balance: 0,
          avatarInitials: deriveInitials(receiver.name),
        };
        return [synthesized, ...prev];
      });
      setSelectedNavId(receiver.accountId);

      let settled = false;
      let settleTimeoutId: ReturnType<typeof setTimeout> | undefined;
      function finalize(success: boolean) {
        if (settled) return;
        settled = true;
        clearTimeout(settleTimeoutId);
        unsubscribe();
        setIsProcessing(false);
        setSenderRefreshTick((t) => t + 1);
        setReceiverRefreshTick((t) => t + 1);
        if (!success) return;

        const now = new Date();

        setSenderTxs((prev) => [
          {
            id: generateId("tx"),
            paymentId: traceId,
            time: now,
            counterparty: receiver.name,
            amount: netPayment,
            currency: "INR",
            status: "COMPLETED",
            direction: "out",
          },
          ...prev,
        ]);

        const events: LiveActivityEvent[] = [
          {
            id: generateId("act"),
            type: "payment_received",
            amount: netPayment,
            currency: "INR",
            from: senderUser.name,
            message: `Payment received from ${senderUser.name}`,
            timestamp: now,
            isNew: true,
          },
        ];

        if (offer) {
          events.push({
            id: generateId("act"),
            type: "offer_redeemed",
            message: `Offer ${offer.code} redeemed successfully`,
            timestamp: new Date(now.getTime() + 500),
            isNew: true,
          });
        }

        if (cashbackAmount) {
          events.push({
            id: generateId("act"),
            type: "cashback_received",
            amount: cashbackAmount,
            currency: "INR",
            message: `Cashback credited from ${offer!.code} offer`,
            timestamp: new Date(now.getTime() + 1_200),
            isNew: true,
          });
        }

        setNewActivityEvents(events);
      }

      const unsubscribe = subscribeToPaymentTimeline(traceId, (dto) => {
        setTimelineSteps((prev) => mergeTimelineSnapshot(prev, dto));
        if (isTimelineFailed(dto)) {
          setTotalTimeMs(dto.total_time);
          finalize(false);
        } else if (isTimelineComplete(dto)) {
          setTotalTimeMs(dto.total_time);
          finalize(true);
        }
      });

      // Trace never reached PAYMENT_COMPLETED in time — refresh anyway, but leave
      // the timeline/processing state alone in case the SSE stream is just lagging.
      settleTimeoutId = setTimeout(() => {
        if (!settled) {
          setSenderRefreshTick((t) => t + 1);
          setReceiverRefreshTick((t) => t + 1);
        }
      }, PAYMENT_SETTLE_TIMEOUT_MS);

      submitPayment(
        {
          sender_id: senderUser.id,
          receiver_id: receiver.accountId,
          amount: Math.round(netPayment * 100),
          currency: senderUser.currency,
          offer_id: offer?.id ?? "",
        },
        traceId,
        idempotencyKey,
      ).catch((err) => {
        console.error("payment submission failed:", err);
        finalize(false);
      });
    },
    [isProcessing, paymentReceiver, offers, senderUser],
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <TopNav
        navAccounts={navSwitcherItems}
        selectedNavAccountId={selectedNavId}
        onNavAccountSelect={handleNavAccountSelect}
        statuses={[
          { label: "Kafka",           connected: metrics?.kafka_status === "CONNECTED" },
          { label: "Offer Service",   connected: metrics?.offer_service_status === "CONNECTED" },
          { label: "Payment Service", connected: metrics?.payment_service_status === "CONNECTED" },
        ]}
        healthStats={[
          { label: "Payments today", value: metrics?.payments_today ?? 0,      icon: <CreditCard className="size-3" /> },
          { label: "Processing",     value: metrics?.payments_processing ?? 0, icon: <Activity className="size-3" /> },
          { label: "Failed",         value: metrics?.payments_failed ?? 0,     icon: <Server className="size-3" /> },
        ]}
        theme={theme}
        onThemeToggle={toggleTheme}
        onOpenReadme={() => setReadmeOpen(true)}
        onOpenArchitecture={() => setArchOpen(true)}
        appMode={appMode}
        onModeChange={setAppMode}
        onLogout={handleLogout}
      />

      {appMode === "consumer" ? (
        <div className="flex flex-1 overflow-hidden min-w-0">
          {/* Left — Sender Wallet */}
          <div className="w-[340px] shrink-0 overflow-hidden flex flex-col">
            <SenderColumn
              sender={senderUser}
              selectedReceiver={paymentReceiver}
              onReceiverChange={setPaymentReceiver}
              offers={offers}
              transactions={senderTxs}
              onSendPayment={handleSendPayment}
              isProcessing={isProcessing}
              onSelectTransaction={(tx) => setSelectedPaymentId(tx.paymentId)}
            />
          </div>

          {/* Center — Distributed Event Timeline */}
          <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
            <CenterColumn
              steps={timelineSteps}
              isRunning={isProcessing}
              stats={{
                paymentsToday:      metrics?.payments_today ?? 0,
                offersRedeemed:     metrics?.offers_redeemed ?? 0,
                paymentsProcessing: metrics?.payments_processing ?? 0,
                failedEvents:       metrics?.payments_failed ?? 0,
              }}
              totalTimeMs={totalTimeMs}
            />
          </div>

          {/* Right — Receiver Wallet (controlled by nav) */}
          <div className="w-[340px] shrink-0 overflow-hidden flex flex-col">
            {selectedNavAccount && (
              <ReceiverColumn
                navAccount={selectedNavAccount}
                newActivityEvents={newActivityEvents}
                refreshTick={receiverRefreshTick}
                onSelectTransaction={(tx) => setSelectedPaymentId(tx.paymentId)}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          {selectedCompany && (
            <CompanyDashboard company={selectedCompany} />
          )}
        </div>
      )}

      <WelcomeOverlay onOpenReadme={() => setReadmeOpen(true)} />
      <ReadmeDialog open={readmeOpen} onOpenChange={setReadmeOpen} />
      <ArchitectureDialog open={archOpen} onOpenChange={setArchOpen} />
      <PaymentDetailsModal
        paymentId={selectedPaymentId}
        onOpenChange={(open) => !open && setSelectedPaymentId(null)}
      />
    </div>
  );
}
