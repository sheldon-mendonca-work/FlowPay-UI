import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Moon,
  Sun,
  Sparkles,
  BookOpen,
  X,
} from "lucide-react";
import Github from '@/assets/github.svg?react';
import Linkedin from '@/assets/linkedin.svg?react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { UserType } from "@/types/user-types";
import { LoadingScreen } from "@/components/login-loading-screen";
import { LogoMark } from "@/components/logo-mark";
import { LeftPanel } from "./leftPanel";
import { RightPanel } from "./rightPanel";
import { useAccountsListQuery } from "@/api/accountsAPI";
import { loginDefault } from "@/api/authAPI";
import { useAuthStore } from "@/store/authstore";
import { type LoginCompanyUser, type LoginAccount } from "@/types/login-page-types";
import { fetchUserInfo } from "@/api/userInfoAPI";


const ARCH_FLOW = [
  "API Gateway",
  "Payment Service",
  "Kafka",
  "Offer Service",
  "Ledger Service",
  "Notification Service",
];

/* ---------------- root ---------------- */

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<UserType>("ACCOUNT");
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [selectedCompanyUser, setSelectedCompanyUser] = useState<string>("");
  const [userList, setUserList] = useState<LoginCompanyUser[]>([]);
  const [accountList, setAccountList] = useState<LoginAccount[]>([]);
  const [readmeOpen, setReadmeOpen] = useState<boolean>(false);
  const [firstVisit, setFirstVisit] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  const canSubmit = mode === "ACCOUNT" ? !!selectedAccount : !!selectedCompanyUser;
  
  // Pass enabled:false here to defer fetching until a condition is met,
  // e.g. useUserListQuery({ enabled: !!someToken }).
  // Default (true) fetches immediately after mount.


  const {
    data: fetchedAccounts,
    isLoading: accountsLoading,
    isError: accountsIsError,
    error: accountsError,
    refetch: refetchAccounts,
  } = useAccountsListQuery();

  const isListLoading = accountsLoading;

  const fetchError =
    (accountsIsError && (accountsError instanceof Error ? accountsError.message : 'Failed to load accounts')) ||
    null;
  // Sync + transform fetched data into typed UI state.
  // This is the right place to reshape API fields before they reach the view.

  useEffect(() => {
    if (!fetchedAccounts) return;
    setUserList(
      fetchedAccounts.filter(account => (account.account_type || "").toUpperCase() === "USER").map((a) => ({
        accountID: a.account_id,
        accountName: a.account_name,
        paymentHandle: a.payment_handle,
        companyName: a.company_name,
        description: a.description,
      })),
    );
    setAccountList(
      fetchedAccounts.filter(account => (account.account_type || "").toUpperCase() === "ACCOUNT").map((a) => ({
        accountID: a.account_id,
        accountName: a.account_name,
        paymentHandle: a.payment_handle,
        description: a.description,
      })),
    );
  }, [fetchedAccounts]);

  // theme init
  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("fp_theme")) as
      | "light"
      | "dark"
      | null;
    const initial =
      stored ??
      (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "dark");
    setTheme(initial);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("fp_theme", theme);
  }, [theme]);

  // first visit
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("fp_seen")) setFirstVisit(true);
  }, []);

  useEffect(() => {
    const fpAuthToken = localStorage.getItem("fp_auth");
    if (!fpAuthToken) return;

    const { state } = JSON.parse(fpAuthToken);
    const { accessToken, refreshToken } = state;
    if (!accessToken) return;

    setLoading(true);
    const { setUserInfo, clearAuth } = useAuthStore.getState();
    fetchUserInfo()
      .then((info) => {
        setUserInfo(info);
        useAuthStore.getState().setTokens(accessToken, refreshToken);
        navigate("/payment");
      })
      .catch(() => {
        clearAuth();
        setLoading(false);
      });
  }, [navigate]);

  
  const handleRetry = () => {
    if (accountsIsError) refetchAccounts();
  };

  const dismissFirstVisit = (openReadme = false) => {
    localStorage.setItem("fp_seen", "1");
    setFirstVisit(false);
    if (openReadme) setReadmeOpen(true);
  };

  const handleEnter = async () => {
    if (!canSubmit) return;
    const accountId = mode === "ACCOUNT" ? selectedAccount : selectedCompanyUser;
    setLoading(true);
    setLoginError(null);
    try {
      const auth = await loginDefault(accountId, mode as "ACCOUNT" | "USER");
      useAuthStore.getState().setTokens(auth.access_token, auth.refresh_token);
      navigate("/payment");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh bg-background text-foreground">
      {/* Theme toggle */}
      <button
        type="button"
        aria-label="Toggle theme"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="fixed right-4 top-4 z-40 grid h-10 w-10 place-items-center rounded-full border border-border bg-card/70 backdrop-blur hover:bg-accent transition-colors"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <main className="mx-auto grid min-h-dvh w-full max-w-[1600px] grid-cols-1 lg:grid-cols-[1fr_1fr] xl:grid-cols-[1fr_1fr]">
        <LeftPanel ARCH_FLOW={ARCH_FLOW}/>
        <RightPanel
          mode={mode}
          setMode={setMode}
          userList={userList}
          accountList={accountList}
          selectedAccount={selectedAccount}
          setSelectedAccount={setSelectedAccount}
          selectedCompanyUser={selectedCompanyUser}
          setSelectedCompanyUser={setSelectedCompanyUser}
          canSubmit={canSubmit}
          onEnter={handleEnter}
          onOpenReadme={() => setReadmeOpen(true)}
          readmeHighlighted={firstVisit}
          isLoading={isListLoading}
          fetchError={loginError ?? fetchError}
          onRetry={loginError ? undefined : handleRetry}
        />
      </main>

      <Footer />

      <ReadmeDialog open={readmeOpen} onOpenChange={setReadmeOpen} />

      {firstVisit && (
        <FirstVisitOverlay
          onOpenReadme={() => dismissFirstVisit(true)}
          onDismiss={() => dismissFirstVisit(false)}
        />
      )}

      {loading && <LoadingScreen />}
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-background/70 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-3 px-6 py-5 text-sm sm:flex-row sm:px-10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[color:var(--accent-cyan)]" />
          <span className="font-medium">Built by Sheldon</span>
          <span className="font-mono text-xs text-muted-foreground">
            © {new Date().getFullYear()} FlowPay
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="grid h-9 w-9 place-items-center rounded-full border border-border hover:bg-accent transition-colors"
          >
            <Github className="lucide lucide-react h-4 w-4" />
          </a>
          <a
            href="https://linkedin.com/"
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
            className="grid h-9 w-9 place-items-center rounded-full border border-border hover:bg-accent transition-colors"
          >
            <Linkedin className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}


function ReadmeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-3xl overflow-hidden p-0 sm:rounded-2xl">
        <div className="max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 z-10 border-b border-border bg-card/95 px-6 py-4 backdrop-blur sm:px-8">
            <div className="flex items-center gap-3">
              <LogoMark className="h-8 w-8" />
              <div className="text-left">
                <DialogTitle className="font-display text-xl">FlowPay — README</DialogTitle>
                <DialogDescription className="text-xs">
                  Distributed systems portfolio project
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-8 px-6 py-6 text-sm leading-relaxed sm:px-8 sm:py-8">
            <Section title="Why FlowPay was built">
              <p className="text-muted-foreground">
                FlowPay exists to demonstrate, in a tangible system, the patterns
                that production payment platforms rely on: idempotent writes,
                eventual consistency through events, double-entry ledger
                accounting, reservation/redemption flows, and end-to-end
                observability. It is the kind of project that's easier to{" "}
                <em>show</em> than to describe in a CV bullet.
              </p>
            </Section>

            <Section title="Engineering concepts demonstrated">
              <ul className="grid gap-2 text-muted-foreground sm:grid-cols-2">
                {[
                  "Event-driven architecture (Kafka)",
                  "Transactional outbox pattern",
                  "Idempotency keys & exactly-once semantics",
                  "Double-entry ledger accounting",
                  "Offer reservation / redemption flow",
                  "Saga-style distributed transactions",
                  "Asynchronous notifications",
                  "Real-time observability & metrics",
                ].map((x) => (
                  <li
                    key={x}
                    className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--accent-cyan)]" />
                    {x}
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="What it is intentionally NOT">
              <p className="text-muted-foreground">
                FlowPay is <strong>not</strong> a consumer banking application.
                There is no KYC, no card issuance, no regulatory compliance
                surface, no real funds movement. Authentication is
                persona-based for demo purposes. The goal is engineering
                pedagogy — not a fintech you'd hand to a customer.
              </p>
            </Section>

            <Section title="Technology stack">
              <div className="flex flex-wrap gap-2 font-mono text-xs">
                {[
                  "Golang",
                  "Kafka",
                  "PostgreSQL",
                  "Redis",
                  "React 19",
                  "TypeScript",
                  "Tailwind v4",
                  "Docker",
                  "Prometheus",
                  "Grafana",
                ].map((t) => (
                  <span
                    key={t}
                    className="rounded-md border border-border bg-background px-2.5 py-1"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Section>

            <Section title="Architecture overview">
              <div className="overflow-x-auto rounded-xl border border-border bg-muted/40 p-4">
                <div className="flex min-w-max items-center gap-2">
                  {ARCH_FLOW.map((s, i) => (
                    <div key={s} className="flex items-center gap-2">
                      <span className="rounded-md border border-border bg-background px-2.5 py-1 font-mono text-[11px]">
                        {s}
                      </span>
                      {i < ARCH_FLOW.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-3 text-muted-foreground">
                Requests enter through the API Gateway, are processed by the
                Payment Service which writes to its outbox, emits Kafka events
                consumed by the Offer and Ledger services, and finally trigger
                Notifications — all observable end-to-end.
              </p>
            </Section>

            <Section title="Links">
              <div className="flex flex-wrap gap-2">
                <a
                  href="https://github.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-accent"
                >
                  <Github className="lucide lucide-react h-4 w-4" /> GitHub repository
                </a>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-accent"
                >
                  <BookOpen className="h-4 w-4" /> Architecture docs
                </a>
              </div>
            </Section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 font-display text-base font-semibold tracking-tight">
        {title}
      </h3>
      {children}
    </section>
  );
}


function FirstVisitOverlay({
  onOpenReadme,
  onDismiss,
}: {
  onOpenReadme: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 animate-fade-up bg-black/70 backdrop-blur-sm">
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="absolute inset-x-0 bottom-10 mx-0 max-w-md px-5 sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:px-0">
        <div className="rounded-2xl border border-white/10 bg-card p-6 text-card-foreground shadow-2xl glow-brand">
          <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-[color:var(--accent-cyan)]" />
            Start here
          </div>
          <h3 className="font-display text-xl font-semibold tracking-tight">
            This project showcases distributed systems concepts
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            FlowPay demonstrates payment infrastructure patterns rather than
            consumer banking features. The README explains the why and the how.
          </p>
          <div className="mt-5 flex gap-2">
            <Button
              onClick={onOpenReadme}
              className="h-11 flex-1 gap-2 bg-[color:var(--brand)] text-[color:var(--brand-foreground)] hover:bg-[color:var(--brand)]/90"
            >
              <BookOpen className="h-4 w-4" /> Open README
            </Button>
            <Button
              onClick={onDismiss}
              variant="outline"
              className="h-11"
            >
              Skip
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}



export default LoginPage;