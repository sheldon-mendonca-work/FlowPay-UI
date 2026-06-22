import { useState, useCallback, useEffect } from "react";
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
  RECEIVER_TRANSACTIONS,
  INITIAL_LIVE_ACTIVITY,
  COMPANY_OFFERS,
  generateId,
  generateIdempotencyKey,
  USERS,
} from "@/lib/mock-data";
import { buildTimelineSteps, animateTimeline } from "@/lib/timeline-utils";
import type {
  User,
  Offer,
  Transaction,
  TimelineStep,
  LiveActivityEvent,
  PaymentResult,
  CompanyOffer,
} from "@/lib/types";

const SENDER_USER = USERS[0];
const RECEIVER_USERS = USERS.slice(1);

const TOP_NAV_STATUSES = [
  { label: "Kafka",            connected: true },
  { label: "Offer Service",    connected: true },
  { label: "Payment Service",  connected: true },
];

const INITIAL_HEALTH = {
  paymentsToday:          1_847,
  offersRedeemed:          312,
  kafkaEventsProcessed:  14_228,
  failedEvents:               3,
};

type Theme    = "light" | "dark";
type AppMode  = "consumer" | "company";

export default function FlowPayDashboard() {
  // ── Theme ────────────────────────────────────────────────────────────
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

  // ── View mode ────────────────────────────────────────────────────────
  const [appMode, setAppMode] = useState<AppMode>("consumer");

  // ── Modals ───────────────────────────────────────────────────────────
  const [readmeOpen, setReadmeOpen] = useState(false);
  const [archOpen, setArchOpen] = useState(false);

  // ── Company offers ───────────────────────────────────────────────────
  const [companyOffers, setCompanyOffers] = useState<CompanyOffer[]>(COMPANY_OFFERS);

  function handleOfferCreated(offer: CompanyOffer) {
    setCompanyOffers((prev) => [offer, ...prev]);
  }

  // ── Consumer payment state ───────────────────────────────────────────
  const [currentSender, setCurrentSender] = useState<User>(SENDER_USER);
  const [selectedReceiverId, setSelectedReceiverId] = useState<string>(RECEIVER_USERS[0].id);

  const [senderDelta, setSenderDelta] = useState<number>(0);
  const [receiverDelta, setReceiverDelta] = useState<number>(0);

  const [senderTxs, setSenderTxs] = useState<Transaction[]>(SENDER_TRANSACTIONS);
  const [receiverTxs, setReceiverTxs] = useState<Transaction[]>(RECEIVER_TRANSACTIONS);

  const [timelineSteps, setTimelineSteps] = useState<TimelineStep[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [activityEvents, setActivityEvents] = useState<LiveActivityEvent[]>(INITIAL_LIVE_ACTIVITY);
  const [health, setHealth] = useState(INITIAL_HEALTH);

  const receiver = RECEIVER_USERS.find((u) => u.id === selectedReceiverId) ?? RECEIVER_USERS[0];

  function handleUserChange(userId: string) {
    const user = USERS.find((u) => u.id === userId);
    if (user) setCurrentSender(user);
  }

  const handleSendPayment = useCallback(
    async (amount: number, receiverId: string, offerId: string | null) => {
      if (isProcessing) return;

      const offer = OFFERS.find((o) => o.id === offerId) ?? null;
      const steps = buildTimelineSteps(offer);

      setIsProcessing(true);
      setTimelineSteps(steps);
      setSenderDelta(0);
      setReceiverDelta(0);

      const paymentId       = generateId("pay");
      const traceId         = generateId("trc");
      const requestId       = generateId("req");
      const reservationId   = offer ? generateId("rsv") : undefined;
      const redemptionId    = offer ? generateId("rdm") : undefined;
      const idempotencyKey  = generateIdempotencyKey();

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
        senderDelta:   -netPayment,
        receiverDelta:  netPayment,
        cashbackAmount,
      };

      const gen = animateTimeline(steps, result, (updated) => {
        setTimelineSteps(updated);
      });

      for await (const _ of gen) {
        // each yield drives a UI update via callback
      }

      setSenderDelta(-netPayment);
      setReceiverDelta(netPayment + (cashbackAmount ?? 0));

      const now = new Date();

      setSenderTxs((prev) => [
        {
          id: generateId("tx"),
          time: now,
          counterparty: receiver.name,
          amount: netPayment,
          currency: "USD",
          status: "COMPLETED",
          direction: "out",
        },
        ...prev,
      ]);

      setReceiverTxs((prev) => [
        {
          id: generateId("rx"),
          time: now,
          counterparty: currentSender.name,
          amount: netPayment,
          currency: "USD",
          status: "COMPLETED",
          direction: "in",
        },
        ...prev,
      ]);

      const newActivities: LiveActivityEvent[] = [
        {
          id: generateId("act"),
          type: "payment_received",
          amount: netPayment,
          currency: "USD",
          from: currentSender.name,
          message: `Payment received from ${currentSender.name}`,
          timestamp: now,
          isNew: true,
        },
      ];

      if (offer) {
        newActivities.push({
          id: generateId("act"),
          type: "offer_redeemed",
          message: `Offer ${offer.code} redeemed successfully`,
          timestamp: new Date(now.getTime() + 500),
          isNew: true,
        });
      }

      if (cashbackAmount) {
        newActivities.push({
          id: generateId("act"),
          type: "cashback_received",
          amount: cashbackAmount,
          currency: "USD",
          message: `Cashback credited from ${offer!.code} offer`,
          timestamp: new Date(now.getTime() + 1200),
          isNew: true,
        });
      }

      setActivityEvents((prev) => [...newActivities, ...prev]);

      setHealth((prev) => ({
        paymentsToday:         prev.paymentsToday + 1,
        offersRedeemed:        prev.offersRedeemed + (offer ? 1 : 0),
        kafkaEventsProcessed:  prev.kafkaEventsProcessed + steps.length,
        failedEvents:          prev.failedEvents,
      }));

      setIsProcessing(false);
    },
    [isProcessing, receiver, currentSender]
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <TopNav
        currentUser={currentSender}
        onUserChange={handleUserChange}
        users={USERS}
        statuses={TOP_NAV_STATUSES}
        healthStats={[
          {
            label: "Payments today",
            value: health.paymentsToday,
            icon: <CreditCard className="size-3" />,
          },
          {
            label: "Kafka events",
            value: health.kafkaEventsProcessed,
            icon: <Activity className="size-3" />,
          },
          {
            label: "Failed",
            value: health.failedEvents,
            icon: <Server className="size-3" />,
          },
        ]}
        theme={theme}
        onThemeToggle={toggleTheme}
        onOpenReadme={() => setReadmeOpen(true)}
        onOpenArchitecture={() => setArchOpen(true)}
        appMode={appMode}
        onModeChange={setAppMode}
      />

      {appMode === "consumer" ? (
        /* ── Consumer View: three-column layout ── */
        <div className="flex flex-1 overflow-hidden min-w-0">
          {/* Left — Sender Wallet */}
          <div className="w-[340px] shrink-0 overflow-hidden flex flex-col">
            <SenderColumn
              sender={currentSender}
              receivers={RECEIVER_USERS}
              offers={OFFERS}
              transactions={senderTxs}
              selectedReceiverId={selectedReceiverId}
              onReceiverChange={setSelectedReceiverId}
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

          {/* Right — Receiver Wallet */}
          <div className="w-[340px] shrink-0 overflow-hidden flex flex-col">
            <ReceiverColumn
              receiver={receiver}
              transactions={receiverTxs}
              activityEvents={activityEvents}
              balanceDelta={receiverDelta}
            />
          </div>
        </div>
      ) : (
        /* ── Company View: full-width dashboard ── */
        <div className="flex-1 overflow-hidden">
          <CompanyDashboard
            offers={companyOffers}
            onOfferCreated={handleOfferCreated}
          />
        </div>
      )}

      {/* First-time welcome overlay */}
      <WelcomeOverlay onOpenReadme={() => setReadmeOpen(true)} />

      {/* Modals */}
      <ReadmeDialog open={readmeOpen} onOpenChange={setReadmeOpen} />
      <ArchitectureDialog open={archOpen} onOpenChange={setArchOpen} />
    </div>
  );
}
