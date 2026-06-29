

import { useState } from "react";
import { ChevronRight, ChevronLeft, Check, Zap, Building2, CalendarDays } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CompanyOffer, OfferType } from "@/types/types";
import { generateId } from "@/lib/mock-data";

interface CreateOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (offer: CompanyOffer) => void;
}

type OfferFormState = {
  // Step 1
  code: string;
  type: OfferType;
  isPercentage: boolean;
  benefitAmount: string;
  maxBenefit: string;
  // Step 2
  minPaymentAmount: string;
  maxPaymentAmount: string;
  maxRedemptions: string;
  perUserLimit: string;
  startTime: string;
  endTime: string;
  // Step 3
  initialBudget: string;
};

const STEPS = [
  { label: "Offer Basics",  icon: Zap },
  { label: "Eligibility",   icon: Building2 },
  { label: "Funding",       icon: CalendarDays },
];

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  prefix,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  prefix?: string;
}) {
  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full h-9 rounded-md border border-input bg-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors font-mono",
          prefix ? "pl-7 pr-3" : "px-3"
        )}
      />
    </div>
  );
}

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1.5 p-1 rounded-lg bg-muted">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex-1 h-7 rounded-md text-xs font-medium transition-all",
            value === opt.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const today = new Date().toISOString().slice(0, 16);
const inMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

const DEFAULTS: OfferFormState = {
  code: "",
  type: "DISCOUNT",
  isPercentage: true,
  benefitAmount: "10",
  maxBenefit: "500",
  minPaymentAmount: "50",
  maxPaymentAmount: "",
  maxRedemptions: "1000",
  perUserLimit: "3",
  startTime: today,
  endTime: inMonth,
  initialBudget: "5000",
};

export function CreateOfferDialog({ open, onOpenChange, onCreated }: CreateOfferDialogProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<OfferFormState>(DEFAULTS);

  function set<K extends keyof OfferFormState>(key: K, value: OfferFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const poolName = form.code
    ? `COMPANY_${form.code.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_POOL`
    : "COMPANY_OFFER_POOL";

  function handleCreate() {
    const now = new Date();
    const offer: CompanyOffer = {
      id: generateId("coff"),
      code: form.code || "OFFER" + Math.random().toString(36).slice(2, 6).toUpperCase(),
      type: form.type,
      benefitAmount: parseFloat(form.benefitAmount) || 10,
      isPercentage: form.isPercentage,
      maxBenefit: parseFloat(form.maxBenefit) || 500,
      minPaymentAmount: parseFloat(form.minPaymentAmount) || 50,
      maxPaymentAmount: form.maxPaymentAmount ? parseFloat(form.maxPaymentAmount) : null,
      maxRedemptions: parseInt(form.maxRedemptions) || 1000,
      perUserLimit: parseInt(form.perUserLimit) || 3,
      startTime: new Date(form.startTime),
      endTime: new Date(form.endTime),
      promotionPoolName: poolName,
      initialBudget: parseFloat(form.initialBudget) || 5000,
      remainingBudget: parseFloat(form.initialBudget) || 5000,
      totalRedemptions: 0,
      conversionRate: 0,
      status: "ACTIVE",
      fundingStatus: "FUNDED",
      createdAt: now,
    };
    onCreated(offer);
    onOpenChange(false);
    setStep(0);
    setForm(DEFAULTS);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full p-0 gap-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <DialogTitle className="text-base font-bold">Create Offer</DialogTitle>
          {/* Step indicator */}
          <div className="flex items-center gap-0 mt-3">
            {STEPS.map((s, i) => (
              <div key={s.label} className="flex items-center flex-1">
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all w-full",
                  i === step
                    ? "bg-primary/10 text-primary"
                    : i < step
                    ? "text-success"
                    : "text-muted-foreground/50"
                )}>
                  <div className={cn(
                    "size-5 rounded-full flex items-center justify-center text-[10px] font-bold border shrink-0",
                    i === step
                      ? "border-primary bg-primary text-primary-foreground"
                      : i < step
                      ? "border-success bg-success text-primary-foreground"
                      : "border-border text-muted-foreground"
                  )}>
                    {i < step ? <Check className="size-3" /> : i + 1}
                  </div>
                  <span className="truncate">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("h-px w-4 shrink-0", i < step ? "bg-success/50" : "bg-border/50")} />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 min-h-0">

          {/* ── Step 1: Offer Basics ── */}
          {step === 0 && (
            <>
              <FieldGroup label="Offer Code">
                <TextInput
                  value={form.code}
                  onChange={(v) => set("code", v.toUpperCase())}
                  placeholder="e.g. SAVE10, FLAT25"
                />
                <p className="text-[10px] text-muted-foreground">Unique alphanumeric code shown to consumers</p>
              </FieldGroup>

              <FieldGroup label="Offer Type">
                <ToggleGroup
                  options={[
                    { label: "Discount", value: "DISCOUNT" as OfferType },
                    { label: "Cashback", value: "CASHBACK" as OfferType },
                  ]}
                  value={form.type}
                  onChange={(v) => set("type", v)}
                />
              </FieldGroup>

              <FieldGroup label="Benefit Structure">
                <ToggleGroup
                  options={[
                    { label: "Percentage (%)", value: "true" },
                    { label: "Fixed Amount ($)", value: "false" },
                  ]}
                  value={String(form.isPercentage)}
                  onChange={(v) => set("isPercentage", v === "true")}
                />
              </FieldGroup>

              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label={form.isPercentage ? "Percentage (%)" : "Fixed Amount ($)"}>
                  <TextInput
                    type="number"
                    value={form.benefitAmount}
                    onChange={(v) => set("benefitAmount", v)}
                    prefix={form.isPercentage ? "%" : "$"}
                    placeholder={form.isPercentage ? "10" : "25.00"}
                  />
                </FieldGroup>
                <FieldGroup label="Maximum Benefit ($)">
                  <TextInput
                    type="number"
                    value={form.maxBenefit}
                    onChange={(v) => set("maxBenefit", v)}
                    prefix="$"
                    placeholder="500"
                  />
                </FieldGroup>
              </div>
            </>
          )}

          {/* ── Step 2: Eligibility ── */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Min Payment ($)">
                  <TextInput
                    type="number"
                    value={form.minPaymentAmount}
                    onChange={(v) => set("minPaymentAmount", v)}
                    prefix="$"
                    placeholder="50"
                  />
                </FieldGroup>
                <FieldGroup label="Max Payment ($) — optional">
                  <TextInput
                    type="number"
                    value={form.maxPaymentAmount}
                    onChange={(v) => set("maxPaymentAmount", v)}
                    prefix="$"
                    placeholder="No limit"
                  />
                </FieldGroup>
                <FieldGroup label="Max Redemptions">
                  <TextInput
                    type="number"
                    value={form.maxRedemptions}
                    onChange={(v) => set("maxRedemptions", v)}
                    placeholder="1000"
                  />
                </FieldGroup>
                <FieldGroup label="Per User Limit">
                  <TextInput
                    type="number"
                    value={form.perUserLimit}
                    onChange={(v) => set("perUserLimit", v)}
                    placeholder="3"
                  />
                </FieldGroup>
              </div>

              <FieldGroup label="Start Time">
                <input
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(e) => set("startTime", e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-input text-sm text-foreground px-3 font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </FieldGroup>

              <FieldGroup label="End Time">
                <input
                  type="datetime-local"
                  value={form.endTime}
                  onChange={(e) => set("endTime", e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-input text-sm text-foreground px-3 font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </FieldGroup>
            </>
          )}

          {/* ── Step 3: Funding ── */}
          {step === 2 && (
            <>
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3.5 flex flex-col gap-1.5">
                <p className="text-xs font-semibold text-foreground">Promotion Pool</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  A promotion pool account is automatically created for this offer. It holds the
                  budget used to fund discounts and cashback payouts to users.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card px-4 py-3.5 flex flex-col gap-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Promotion Pool Account
                </p>
                <p className="text-sm font-mono font-semibold text-foreground">
                  {poolName || "—"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Automatically generated · Read-only
                </p>
              </div>

              <FieldGroup label="Initial Budget ($)">
                <TextInput
                  type="number"
                  value={form.initialBudget}
                  onChange={(v) => set("initialBudget", v)}
                  prefix="$"
                  placeholder="5000"
                />
                <p className="text-[10px] text-muted-foreground">
                  Funds deposited into the promotion pool at creation
                </p>
              </FieldGroup>

              {/* Summary */}
              <div className="rounded-lg border border-border bg-card px-4 py-3.5 flex flex-col gap-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                  Offer Summary
                </p>
                {[
                  { label: "Code",    value: form.code || "—" },
                  { label: "Type",    value: form.type },
                  {
                    label: "Benefit",
                    value: form.isPercentage
                      ? `${form.benefitAmount}% (max $${form.maxBenefit})`
                      : `$${form.benefitAmount}`,
                  },
                  { label: "Min Payment", value: `$${form.minPaymentAmount}` },
                  { label: "Budget",  value: `$${parseFloat(form.initialBudget || "0").toLocaleString()}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-xs font-mono font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer navigation */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="gap-1"
          >
            <ChevronLeft className="size-3.5" />
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              size="sm"
              onClick={() => setStep((s) => s + 1)}
              className="gap-1"
            >
              Next
              <ChevronRight className="size-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleCreate}
              className="gap-1"
            >
              <Check className="size-3.5" />
              Create Offer
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
