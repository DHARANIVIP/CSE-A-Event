"use client";

import React, { useEffect } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical application runtime error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Panel className="max-w-md w-full flex flex-col items-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-danger/20 border-3 border-danger flex items-center justify-center font-display text-3xl text-danger font-black">
          !
        </div>

        <h1 className="font-display text-3xl uppercase text-danger font-black tracking-tight">
          SYSTEM ANOMALY
        </h1>

        <p className="font-mono text-sm text-ink leading-relaxed">
          An unexpected forensic processor failure occurred. The line went dead. Try reloading the station or verify network integrity.
        </p>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={() => (window.location.href = "/")}>
            PORTAL HOME
          </Button>
          <Button variant="primary" onClick={() => reset()}>
            TRY AGAIN
          </Button>
        </div>
      </Panel>
    </div>
  );
}
