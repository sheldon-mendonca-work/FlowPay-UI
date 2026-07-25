import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { Loader2, X } from "lucide-react";
import { useDeploymentStore } from "@/store/deploymentstore";

export function DeploymentReadyBanner({
  onOpenArchitecture,
}: {
  onOpenArchitecture: () => void;
}) {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const ready = useDeploymentStore((s) => s.ready);
  const [dismissed, setDismissed] = useState(false);
  const wasReady = useRef(ready);

  useEffect(() => {
    if (!wasReady.current && ready && !dismissed) {
      enqueueSnackbar("Let's continue", { variant: "success" });
      setDismissed(true);
    }
    wasReady.current = ready;
  }, [ready, dismissed, enqueueSnackbar]);

  if (ready || dismissed) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[color:var(--accent-cyan)]" />
          <span>Your architecture is getting ready.</span>
        </div>
        <span className="text-muted-foreground">
          In the meantime, take a look at the{" "}
          <button
            type="button"
            onClick={onOpenArchitecture}
            className="font-medium underline-offset-2 hover:underline"
          >
            architecture
          </button>{" "}
          or the{" "}
          <button
            type="button"
            onClick={() => navigate("/metrics")}
            className="font-medium underline-offset-2 hover:underline"
          >
            metrics
          </button>
          .
        </span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="ml-auto grid h-7 w-7 shrink-0 place-items-center rounded-full hover:bg-accent"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
