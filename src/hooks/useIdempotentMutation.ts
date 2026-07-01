import { useCallback, useState } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";

export type IdempotentStatus = "IDLE" | "PROCESSING" | "COMPLETED" | "FAILED";

// Lets a mutationFn report an async backend state (e.g. the request was
// accepted but is still being worked on) instead of only resolve/reject.
export interface IdempotentAsyncResult<TData> {
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  data?: TData;
  message?: string;
}

function isAsyncResult<TData>(value: unknown): value is IdempotentAsyncResult<TData> {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    ["PROCESSING", "COMPLETED", "FAILED"].includes((value as { status: unknown }).status as string)
  );
}

interface UseIdempotentMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables, idempotencyKey: string) => Promise<TData | IdempotentAsyncResult<TData>>;
  onSuccess?: (data: TData) => void;
  onError?: (message: string) => void;
  invalidateQueryKeys?: QueryKey[];
}

// Owns the idempotency-key lifecycle for one logical mutating operation
// (e.g. one open/close cycle of a "Create X" dialog):
//  - same key survives duplicate submits, PROCESSING, and retries on the same form
//  - key rotates on success, on a fresh `startOperation`, or when the user
//    edits the form after a FAILED attempt (that's a new logical request)
export function useIdempotentMutation<TData, TVariables = void>(
  options: UseIdempotentMutationOptions<TData, TVariables>,
) {
  const queryClient = useQueryClient();

  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [status, setStatus] = useState<IdempotentStatus>("IDLE");
  const [error, setError] = useState<string | null>(null);

  const startOperation = useCallback(() => {
    setIdempotencyKey(crypto.randomUUID());
    setStatus("IDLE");
    setError(null);
  }, []);

  const endOperation = useCallback(() => {
    setIdempotencyKey(null);
    setStatus("IDLE");
    setError(null);
  }, []);

  // Call this from the form's field setters. It only rotates the key if the
  // previous attempt failed — editing the form mid-flight or after success
  // isn't relevant, since those cases already get a fresh key elsewhere.
  const notifyFieldChanged = useCallback(() => {
    setStatus((prevStatus) => {
      if (prevStatus !== "FAILED") return prevStatus;
      setIdempotencyKey(crypto.randomUUID());
      setError(null);
      return "IDLE";
    });
  }, []);

  const mutate = useCallback(
    async (variables: TVariables) => {
      if (status === "PROCESSING") return; // duplicate submit / double-click, same in-flight request

      const key = idempotencyKey ?? crypto.randomUUID();
      setIdempotencyKey(key);
      setStatus("PROCESSING");
      setError(null);

      try {
        const result = await options.mutationFn(variables, key);
        const outcome = isAsyncResult<TData>(result) ? result : { status: "COMPLETED" as const, data: result };

        if (outcome.status === "PROCESSING") {
          setStatus("PROCESSING");
          return;
        }

        if (outcome.status === "FAILED") {
          const message = outcome.message ?? "Something went wrong";
          setStatus("FAILED");
          setError(message);
          options.onError?.(message);
          return;
        }

        setStatus("COMPLETED");
        setIdempotencyKey(null);
        options.invalidateQueryKeys?.forEach((queryKey: QueryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        );
        options.onSuccess?.(outcome.data as TData);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Something went wrong";
        setStatus("FAILED");
        setError(message);
        options.onError?.(message);
      }
    },
    [status, idempotencyKey, queryClient, options],
  );

  return {
    mutate,
    status,
    error,
    isProcessing: status === "PROCESSING",
    idempotencyKey,
    startOperation,
    endOperation,
    notifyFieldChanged,
  };
}
