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
import {
  SENDER_TRANSACTIONS,
  generateId,
  generateIdempotencyKey,
} from "@/lib/mock-data";
import { buildTimelineSteps, animateTimeline } from "@/lib/timeline-utils";
import { fetchNavAccounts } from "@/api/navAccountsAPI";
import { fetchOffers } from "@/api/offersAPI";
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
  NavCompany,
  Offer,
} from "@/types/types";

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
  const navigate = useNavigate();

  // ── Auth / sender identity ─────────────────────────────────────────────
  const userInfo = useAuthStore((s) => s.userInfo);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  

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

      const offer = offers.find((o) => o.id === offerId) ?? null;
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
    [isProcessing, paymentReceiver, offers],
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <TopNav
        navAccounts={navSwitcherItems}
        selectedNavAccountId={selectedNavId}
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
          {selectedCompany && (
            <CompanyDashboard company={selectedCompany} />
          )}
        </div>
      )}

      <WelcomeOverlay onOpenReadme={() => setReadmeOpen(true)} />
      <ReadmeDialog open={readmeOpen} onOpenChange={setReadmeOpen} />
      <ArchitectureDialog open={archOpen} onOpenChange={setArchOpen} />
    </div>
  );
}
