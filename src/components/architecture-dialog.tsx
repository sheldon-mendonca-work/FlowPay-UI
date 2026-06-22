

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ArchitectureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ARCH_NODES = [
  {
    label: "Client",
    sublabel: "Dashboard UI",
    description: "Initiates payment requests. Renders the event timeline and wallet state updates.",
    color: "border-info/40 bg-info/8 text-info",
    dot: "bg-info",
  },
  {
    label: "Payment Service",
    sublabel: "REST API",
    description: "Validates payment parameters, coordinates with the Offer Service, persists to Postgres, and publishes to the transactional outbox.",
    color: "border-primary/40 bg-primary/8 text-primary",
    dot: "bg-primary",
  },
  {
    label: "Postgres",
    sublabel: "Primary datastore",
    description: "Source of truth for payment state, account balances, and the transactional outbox table. All writes are atomic.",
    color: "border-warning/40 bg-warning/8 text-warning",
    dot: "bg-warning",
  },
  {
    label: "Transactional Outbox",
    sublabel: "Reliability pattern",
    description: "Events are written to an outbox table in the same DB transaction as the payment. A polling worker reads and publishes them to Kafka, guaranteeing at-least-once delivery.",
    color: "border-warning/40 bg-warning/8 text-warning",
    dot: "bg-warning",
  },
  {
    label: "Kafka",
    sublabel: "Event broker",
    description: "Durable, partitioned event stream. Decouples producers (Payment Service) from consumers (Offer Service, Ledger). Enables replay and fan-out.",
    color: "border-success/40 bg-success/8 text-success",
    dot: "bg-success",
  },
  {
    label: "Offer Service",
    sublabel: "Promotion engine",
    description: "Consumes payment events from Kafka. Validates offer eligibility, atomically reserves budget on payment initiation, and redeems on confirmation.",
    color: "border-primary/40 bg-primary/8 text-primary",
    dot: "bg-primary",
  },
  {
    label: "Ledger Updates",
    sublabel: "Double-entry accounting",
    description: "Applies debits to sender and credits to receiver. Handles cashback credit events. Maintains audit trail for every balance mutation.",
    color: "border-success/40 bg-success/8 text-success",
    dot: "bg-success",
  },
];

export function ArchitectureDialog({ open, onOpenChange }: ArchitectureDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-full max-h-[85vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 py-5 border-b border-border shrink-0">
          <DialogTitle className="text-lg font-bold">System Architecture</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1 font-mono">FlowPay / Payment Flow</p>
        </DialogHeader>

        <div className="px-6 py-6 flex flex-col gap-0">
          {ARCH_NODES.map((node, i) => (
            <div key={node.label}>
              {/* Node card */}
              <div className={`rounded-lg border px-4 py-3 flex flex-col gap-1 ${node.color}`}>
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full shrink-0 ${node.dot}`} />
                  <span className="text-sm font-semibold">{node.label}</span>
                  <span className="text-[10px] font-mono opacity-70 ml-auto">{node.sublabel}</span>
                </div>
                <p className="text-[12px] leading-relaxed text-muted-foreground pl-4">
                  {node.description}
                </p>
              </div>

              {/* Arrow connector */}
              {i < ARCH_NODES.length - 1 && (
                <div className="flex flex-col items-center py-1 gap-0.5">
                  <div className="w-px h-3 bg-border" />
                  <svg
                    className="size-3 text-muted-foreground/50"
                    viewBox="0 0 12 12"
                    fill="currentColor"
                  >
                    <path d="M6 9L1 3h10L6 9z" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
