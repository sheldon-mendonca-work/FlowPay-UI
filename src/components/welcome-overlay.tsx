

import { useEffect, useState } from "react";
import { BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "flowpay_welcome_dismissed";

interface WelcomeOverlayProps {
  onOpenReadme: () => void;
}

export function WelcomeOverlay({ onOpenReadme }: WelcomeOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  }

  function handleOpenReadme() {
    dismiss();
    onOpenReadme();
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-8 flex flex-col gap-6">
        {/* Logo mark */}
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 16 16"
              className="size-5 text-primary-foreground"
              fill="currentColor"
            >
              <path d="M8 1l1.5 4.5H14l-3.75 2.72 1.43 4.39L8 10.09l-3.68 2.62 1.43-4.39L2 5.5h4.5L8 1z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">Welcome to FlowPay</h1>
            <p className="text-xs text-muted-foreground">Distributed Payment System Demo</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-foreground leading-relaxed">
            If you&apos;re here, you&apos;re probably evaluating this project.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Before exploring the dashboard, please read the project README to understand what is
            being demonstrated and why certain design decisions exist.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <Button
            onClick={handleOpenReadme}
            className="w-full h-10 font-semibold"
          >
            <BookOpen data-icon="inline-start" />
            Open README
          </Button>
          <Button
            variant="outline"
            onClick={dismiss}
            className="w-full h-10"
          >
            <ArrowRight data-icon="inline-start" />
            Continue to Dashboard
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          This message will not appear again after dismissal.
        </p>
      </div>
    </div>
  );
}
