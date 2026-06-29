import { useState, useCallback, useEffect, useMemo } from "react";
import { Activity, CreditCard, Server } from "lucide-react";
import { TopNav } from "@/components/top-nav";
import { SenderColumn } from "@/components/sender-column";
import { CenterColumn } from "@/components/center-column";
import { ReceiverColumn } from "@/components/receiver-column";
import { CompanyDashboard } from "@/components/company-dashboard";
import { WelcomeOverlay } from "@/components/welcome-overlay";
import { ReadmeDialog } from "@/components/readme-dialog";
import { ArchitectureDialog } from "@/components/architecture-dialog";
import {
  OFFERS,
  SENDER_TRANSACTIONS,
  generateId,
  generateIdempotencyKey,
} from "@/lib/mock-data";
import { buildTimelineSteps, animateTimeline } from "@/lib/timeline-utils";
import { fetchNavAccounts } from "@/api/navAccountsAPI";
import { useAuthStore } from "@/store/authstore";
import type {
  User,
  Currency,
  Transaction,
  TimelineStep,
  LiveActivityEvent,
  PaymentResult,
  NavAccount,
  ReceiverResult,
} from "@/types/types";

function deriveInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const TOP_NAV_STATUSES = [
  { label: "Kafka",            connected: true },
  { label: "Offer Service",    connected: true },
  { label: "Payment Service",  connected: true },
];

const INITIAL_HEALTH = {
  paymentsToday:         1_847,
  offersRedeemed:          312,
  kafkaEventsProcessed: 14_228,
  failedEvents:              3,
};

type Theme   = "light" | "dark";
type AppMode = "consumer" | "company";

export default function FlowPayDashboard() {
  // ── Auth / sender identity ─────────────────────────────────────────────
  const userInfo = useAuthStore((s) => s.userInfo);

  const senderUser: User = useMemo(() => {
    if (!userInfo) {
      // ProtectedRoute guarantees userInfo is set before we render; this is a type-safe fallback
      return { id: "", accountId: "", name: "Loading…", avatarInitials: "…", balance: 0, currency: "INR" };
    }
    return {
      id: userInfo.account_id,
      accountId: userInfo.account_id,
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

  // ── Nav accounts (right panel / company) ──────────────────────────────
  const [navAccountsOrdered, setNavAccountsOrdered] = useState<NavAccount[]>([]);
  const [selectedNavAccountId, setSelectedNavAccountId] = useState<string>("");

  // Fetch nav accounts when appMode changes
  useEffect(() => {
    const type = appMode === "consumer" ? "ACCOUNT" : "COMPANY";
    fetchNavAccounts(type).then((accounts) => {
      setNavAccountsOrdered(accounts);
      setSelectedNavAccountId(accounts[0]?.id ?? "");
    });
  }, [appMode]);

  // Promote-to-front when a "More" account is selected
  function handleNavAccountSelect(id: string) {
    setSelectedNavAccountId(id);
    setNavAccountsOrdered((prev) => {
      const idx = prev.findIndex((a) => a.id === id);
      if (idx <= 1) return prev; // already visible
      const account = prev[idx];
      return [account, ...prev.filter((a) => a.id !== id)];
    });
  }

  const selectedNavAccount = navAccountsOrdered.find((a) => a.id === selectedNavAccountId);

  // ── Payment receiver (independent of nav) ────────────────────────────
  const [paymentReceiver, setPaymentReceiver] = useState<ReceiverResult | null>(null);

  // ── Consumer payment state ────────────────────────────────────────────
  const [senderDelta, setSenderDelta] = useState<number>(0);
  const [receiverDelta, setReceiverDelta] = useState<number>(0);

  const [senderTxs, setSenderTxs] = useState<Transaction[]>(SENDER_TRANSACTIONS);

  const [timelineSteps, setTimelineSteps] = useState<TimelineStep[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // New activity events produced by the payment flow; fed into ReceiverColumn
  const [newActivityEvents, setNewActivityEvents] = useState<LiveActivityEvent[]>([]);
  const [health, setHealth] = useState(INITIAL_HEALTH);

  const handleSendPayment = useCallback(
    async (amount: number, _receiverId: string, offerId: string | null) => {
      if (isProcessing || !paymentReceiver) return;

      const offer = OFFERS.find((o) => o.id === offerId) ?? null;
      const steps = buildTimelineSteps(offer);

      setIsProcessing(true);
      setTimelineSteps(steps);
      setSenderDelta(0);
      setReceiverDelta(0);
      setNewActivityEvents([]);

      const paymentId      = generateId("pay");
      const traceId        = generateId("trc");
      const requestId      = generateId("req");
      const reservationId  = offer ? generateId("rsv") : undefined;
      const redemptionId   = offer ? generateId("rdm") : undefined;
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

      const result: PaymentResult = {
        paymentId,
        traceId,
        requestId,
        offerId: offer?.id,
        reservationId,
        redemptionId,
        idempotencyKey,
        senderDelta:  -netPayment,
        receiverDelta: netPayment,
        cashbackAmount,
      };

      const gen = animateTimeline(steps, result, (updated) => {
        setTimelineSteps(updated);
      });
      for await (const _ of gen) { /* each yield drives a UI update via callback */ }

      setSenderDelta(-netPayment);
      setReceiverDelta(netPayment + (cashbackAmount ?? 0));

      const now = new Date();

      setSenderTxs((prev) => [
        {
          id: generateId("tx"),
          time: now,
          counterparty: paymentReceiver.name,
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

      setHealth((prev) => ({
        paymentsToday:        prev.paymentsToday + 1,
        offersRedeemed:       prev.offersRedeemed + (offer ? 1 : 0),
        kafkaEventsProcessed: prev.kafkaEventsProcessed + steps.length,
        failedEvents:         prev.failedEvents,
      }));

      setIsProcessing(false);
    },
    [isProcessing, paymentReceiver],
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <TopNav
        navAccounts={navAccountsOrdered}
        selectedNavAccountId={selectedNavAccountId}
        onNavAccountSelect={handleNavAccountSelect}
        statuses={TOP_NAV_STATUSES}
        healthStats={[
          { label: "Payments today", value: health.paymentsToday,        icon: <CreditCard className="size-3" /> },
          { label: "Kafka events",   value: health.kafkaEventsProcessed, icon: <Activity className="size-3" /> },
          { label: "Failed",         value: health.failedEvents,          icon: <Server className="size-3" /> },
        ]}
        theme={theme}
        onThemeToggle={toggleTheme}
        onOpenReadme={() => setReadmeOpen(true)}
        onOpenArchitecture={() => setArchOpen(true)}
        appMode={appMode}
        onModeChange={setAppMode}
      />

      {appMode === "consumer" ? (
        <div className="flex flex-1 overflow-hidden min-w-0">
          {/* Left — Sender Wallet */}
          <div className="w-[340px] shrink-0 overflow-hidden flex flex-col">
            <SenderColumn
              sender={senderUser}
              selectedReceiver={paymentReceiver}
              onReceiverChange={setPaymentReceiver}
              offers={OFFERS}
              transactions={senderTxs}
              onSendPayment={handleSendPayment}
              isProcessing={isProcessing}
              balanceDelta={senderDelta}
            />
          </div>

          {/* Center — Distributed Event Timeline */}
          <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
            <CenterColumn
              steps={timelineSteps}
              isRunning={isProcessing}
              stats={health}
            />
          </div>

          {/* Right — Receiver Wallet (controlled by nav) */}
          <div className="w-[340px] shrink-0 overflow-hidden flex flex-col">
            {selectedNavAccount && (
              <ReceiverColumn
                navAccount={selectedNavAccount}
                newActivityEvents={newActivityEvents}
                balanceDelta={receiverDelta}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          {selectedNavAccount && (
            <CompanyDashboard selectedCompany={selectedNavAccount} />
          )}
        </div>
      )}

      <WelcomeOverlay onOpenReadme={() => setReadmeOpen(true)} />
      <ReadmeDialog open={readmeOpen} onOpenChange={setReadmeOpen} />
      <ArchitectureDialog open={archOpen} onOpenChange={setArchOpen} />
    </div>
  );
}
