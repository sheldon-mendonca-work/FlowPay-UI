import { LineChart } from "lucide-react";

function MetricsPage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-3 text-center">
        <LineChart className="h-8 w-8 text-muted-foreground" />
        <h1 className="font-display text-xl font-semibold tracking-tight">Metrics</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          System metrics are coming soon.
        </p>
      </div>
    </div>
  );
}

export default MetricsPage;
