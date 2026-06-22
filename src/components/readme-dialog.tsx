

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ReadmeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-1.5 pl-4">
      {items.map((item) => (
        <li key={item} className="text-sm text-muted-foreground leading-relaxed list-disc">
          {item}
        </li>
      ))}
    </ul>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="size-5 rounded-full bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
        {n}
      </span>
      <span className="text-sm text-muted-foreground leading-relaxed">{text}</span>
    </div>
  );
}

export function ReadmeDialog({ open, onOpenChange }: ReadmeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-5 border-b border-border shrink-0">
          <DialogTitle className="text-lg font-bold">Project README</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1 font-mono">FlowPay / Distributed Payment System</p>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="flex flex-col gap-6 py-6">

            <Section title="What is FlowPay?">
              <p className="text-sm text-muted-foreground leading-relaxed">
                FlowPay is a distributed payment platform built to demonstrate backend and distributed
                systems concepts. This project is intentionally designed as an engineering showcase
                rather than a consumer banking product.
              </p>
            </Section>

            <Separator />

            <Section title="Why was it built?">
              <p className="text-sm text-muted-foreground leading-relaxed">The goal is to demonstrate:</p>
              <BulletList items={[
                "Idempotency — safe request retries without duplicate processing",
                "Distributed transactions — coordinating state across multiple services",
                "Transactional outbox pattern — reliable event publishing with Postgres",
                "Kafka event processing — async event streaming and consumption",
                "Offer reservation — atomic offer locking before payment commitment",
                "Offer redemption — finalizing offer benefits post-payment",
                "Eventual consistency — async state convergence across services",
                "Reconciliation workflows — detecting and correcting state drift",
                "Failure handling — graceful degradation and retry semantics",
              ]} />
            </Section>

            <Separator />

            <Section title="Why does the UI look like this?">
              <p className="text-sm text-muted-foreground leading-relaxed">
                The dashboard focuses on system visibility rather than consumer experience.
                The goal is to visualize:
              </p>
              <BulletList items={[
                "Payment execution — step-by-step lifecycle from request to completion",
                "Event propagation — how events flow across service boundaries",
                "Kafka publishing — outbox-driven reliable event delivery",
                "Offer lifecycle — reservation → validation → redemption",
                "Ledger updates — both sender debit and receiver credit",
              ]} />
            </Section>

            <Separator />

            <Section title="What is intentionally missing?">
              <p className="text-sm text-muted-foreground leading-relaxed">
                This is not intended to be a production fintech application. Features intentionally excluded:
              </p>
              <BulletList items={[
                "KYC — identity verification and onboarding",
                "Real banking integrations — core banking, SWIFT, ACH",
                "Compliance systems — AML, sanctions screening",
                "Fraud detection — rule engines, ML models",
                "Risk engines — credit scoring, exposure limits",
                "Settlement networks — clearinghouse integration",
                "Full authentication flows — OAuth, MFA, sessions",
              ]} />
            </Section>

            <Separator />

            <Section title="Architecture">
              <div className="rounded-lg border border-border bg-muted/40 px-4 py-4 font-mono text-sm text-foreground">
                <div className="flex flex-col gap-0.5">
                  {[
                    { label: "Client", desc: "Dashboard UI — initiates payments" },
                    { label: "Payment Service", desc: "Validates, persists, coordinates" },
                    { label: "Postgres", desc: "Source of truth for payment state" },
                    { label: "Transactional Outbox", desc: "Reliable event capture in same DB transaction" },
                    { label: "Kafka", desc: "Durable async event stream" },
                    { label: "Offer Service", desc: "Reserves & redeems offers, manages budgets" },
                    { label: "Ledger Updates", desc: "Applies debits and credits per account" },
                  ].map((row, i, arr) => (
                    <div key={row.label}>
                      <div className="flex items-baseline gap-3">
                        <span className="text-primary font-semibold w-44 shrink-0">{row.label}</span>
                        <span className="text-muted-foreground text-xs">{row.desc}</span>
                      </div>
                      {i < arr.length - 1 && (
                        <div className="text-muted-foreground/50 pl-2 py-0.5 text-xs">↓</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            <Separator />

            <Section title="How to use the demo">
              <div className="flex flex-col gap-2.5">
                <Step n={1} text="Select a sender using the user switcher in the top navigation" />
                <Step n={2} text="Select a receiver from the dropdown in the payment form" />
                <Step n={3} text="Enter a payment amount" />
                <Step n={4} text='Click "+ Add Offer" to apply a discount or cashback offer (optional)' />
                <Step n={5} text="Submit the payment using the Send Payment button" />
                <Step n={6} text="Observe the distributed event timeline animate through each service" />
              </div>
            </Section>

            <div className="pb-2" />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
