import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Tag, TrendingUp, DollarSign, BarChart3, Wallet, Percent, ArrowUpRight, Clock, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreateOfferDialog } from "@/components/create-offer-dialog";
import { cn } from "@/lib/utils";
import {
  fetchCompanyOffers,
  fetchCompanyOffersSummary,
  companyOffersQueryKey,
  companyOffersSummaryQueryKey,
} from "@/api/companyOffersAPI";
import type { NavCompany, CompanyOffer } from "@/types/types";

interface CompanyDashboardProps {
  company: NavCompany;
}

function fmt(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: "primary" | "success" | "warning" | "destructive";
}) {
  const colorMap = {
    primary:     "text-primary",
    success:     "text-success",
    warning:     "text-warning",
    destructive: "text-destructive",
  };
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className={cn("", accent ? colorMap[accent] : "text-muted-foreground")}>{icon}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold font-mono tabular-nums text-foreground">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function BudgetBar({ remaining, total }: { remaining: number; total: number }) {
  const pct = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0;
  return (
    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          pct > 40 ? "bg-success" : pct > 15 ? "bg-warning" : "bg-destructive"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function OfferRow({ offer }: { offer: CompanyOffer }) {
  const isDiscount = offer.type === "DISCOUNT";
  const utilizedPct = offer.initialBudget > 0
    ? Math.round(((offer.initialBudget - offer.remainingBudget) / offer.initialBudget) * 100)
    : 0;

  const benefitLabel = offer.isPercentage
    ? `${offer.benefitAmount}% ${isDiscount ? "discount" : "cashback"}`
    : `${fmt(offer.benefitAmount)} ${isDiscount ? "off" : "cashback"}`;

  const daysLeft = Math.max(0, Math.round((offer.endTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "size-9 rounded-lg flex items-center justify-center shrink-0",
            isDiscount ? "bg-info/15 text-info" : "bg-success/15 text-success"
          )}>
            {isDiscount ? <Percent className="size-4" /> : <DollarSign className="size-4" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-mono font-bold text-foreground">{offer.code}</span>
              <span className={cn(
                "text-[9px] px-1.5 py-px rounded font-bold uppercase border",
                isDiscount
                  ? "border-info/30 text-info bg-info/10"
                  : "border-success/30 text-success bg-success/10"
              )}>
                {offer.type}
              </span>
              <span className={cn(
                "text-[9px] px-1.5 py-px rounded font-bold uppercase border",
                offer.status === "ACTIVE"
                  ? "border-success/30 text-success bg-success/10"
                  : "border-border text-muted-foreground bg-muted"
              )}>
                {offer.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{benefitLabel} · min {fmt(offer.minPaymentAmount)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono shrink-0">
          <Clock className="size-3" />
          {daysLeft}d left
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">
            Redemptions
          </p>
          <p className="text-sm font-mono font-bold text-foreground">
            {offer.totalRedemptions.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">
            Conversion
          </p>
          <div className="flex items-center gap-1">
            <p className="text-sm font-mono font-bold text-foreground">{offer.conversionRate.toFixed(1)}%</p>
            <ArrowUpRight className="size-3 text-success" />
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">
            Utilized
          </p>
          <p className="text-sm font-mono font-bold text-foreground">{utilizedPct}%</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            Pool: <span className="font-mono text-foreground/80">{offer.promotionPoolName}</span>
          </span>
          <span className="text-[10px] font-mono text-foreground">
            {fmt(offer.remainingBudget)} / {fmt(offer.initialBudget)}
          </span>
        </div>
        <BudgetBar remaining={offer.remainingBudget} total={offer.initialBudget} />
      </div>
    </div>
  );
}

export function CompanyDashboard({ company }: CompanyDashboardProps) {
  const [createOpen, setCreateOpen] = useState(false);

  const { data: offers = [], isLoading: offersLoading } = useQuery({
    queryKey: companyOffersQueryKey(company.companyId),
    queryFn: () => fetchCompanyOffers(company.companyId),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: companyOffersSummaryQueryKey(company.companyId),
    queryFn: () => fetchCompanyOffersSummary(company.companyId),
  });

  const loading = offersLoading || summaryLoading;

  const budgetUtilized = summary && summary.initialBudget > 0
    ? Math.round(((summary.initialBudget - summary.budgetRemaining) / summary.initialBudget) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <Building2 className="size-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground truncate">{company.companyName}</h2>
              {/* <span className="text-[10px] font-mono text-muted-foreground shrink-0">{company.paymentHandle}</span> */}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Offer Management · {company.businessName}
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5 shrink-0">
          <Plus className="size-3.5" />
          Create Offer
        </Button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-6 flex flex-col gap-6">

            {/* Per-company metric cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard
                icon={<Tag className="size-4" />}
                label="Active Offers"
                value={String(summary?.activeOffers ?? 0)}
                sub={`${summary?.totalOffers ?? 0} total`}
                accent="primary"
              />
              <MetricCard
                icon={<BarChart3 className="size-4" />}
                label="Total Redemptions"
                value={(summary?.totalRedemptions ?? 0).toLocaleString()}
                accent="success"
              />
              <MetricCard
                icon={<Wallet className="size-4" />}
                label="Budget Remaining"
                value={`$${Math.round((summary?.budgetRemaining ?? 0) / 1000)}k`}
                sub={`${budgetUtilized}% utilized`}
                accent="warning"
              />
              <MetricCard
                icon={<TrendingUp className="size-4" />}
                label="Avg Conversion"
                value={`${(summary?.avgConversionRate ?? 0).toFixed(1)}%`}
                accent="primary"
              />
            </div>

            {/* Offers list */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Offers
                </h3>
                <span className="text-[10px] text-muted-foreground font-mono">{offers.length} total</span>
              </div>

              {offers.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 p-10 flex flex-col items-center gap-3 text-center">
                  <div className="size-10 rounded-full border border-border flex items-center justify-center">
                    <Tag className="size-4 text-muted-foreground/40" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">No offers yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      Create the first offer for {company.companyName}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)} className="gap-1.5">
                    <Plus className="size-3.5" />
                    Create Offer
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {offers.map((offer) => (
                    <OfferRow key={offer.id} offer={offer} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      )}

      <CreateOfferDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyName={company.companyName}
        companyId={company.companyId}
      />
    </div>
  );
}
