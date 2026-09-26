"use client";

import React, { useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { InputBar } from "@/components/ui/InputBar";

export default function AdminDangerZonePage() {
  const [confirmInput, setConfirmInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleReset = async (target: "SUBMISSIONS" | "EVENT") => {
    if (confirmInput.trim() !== "RESET") {
      setStatusMessage('You must type "RESET" in uppercase to confirm.');
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "RESET", target }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMessage(data.message || "Operation completed successfully.");
        setConfirmInput("");
      } else {
        setStatusMessage(data.error?.message || "Failed to execute reset.");
      }
    } catch {
      setStatusMessage("Network error executing reset command.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b-2 border-danger pb-3">
        <h1 className="font-display text-3xl uppercase text-danger font-black tracking-tight">
          DANGER ZONE & EMERGENCIES
        </h1>
        <p className="font-mono text-xs text-muted mt-1">
          Irreversible destructive commands for competition state resets and cryptographic rotation.
        </p>
      </div>

      {statusMessage && (
        <div className="p-4 bg-paper border-3 border-danger rounded text-danger font-mono text-xs font-bold shadow-hard">
          {statusMessage}
        </div>
      )}

      {/* Reset Submissions Only */}
      <Panel className="border-danger/80 space-y-4">
        <h2 className="font-display text-xl uppercase text-danger font-black">
          RESET ALL SUBMISSIONS
        </h2>
        <p className="font-mono text-xs text-ink leading-relaxed">
          Deletes all team attempts, resets the live leaderboard, and re-locks solved mystery chests for all teams. Team roster and PINs remain preserved.
        </p>

        <div className="max-w-xs">
          <InputBar
            label='TYPE "RESET" TO CONFIRM'
            placeholder="RESET"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
          />
        </div>

        <Button
          variant="danger"
          size="sm"
          onClick={() => handleReset("SUBMISSIONS")}
          isLoading={isProcessing}
          disabled={confirmInput !== "RESET"}
        >
          EXECUTE SUBMISSIONS PURGE
        </Button>
      </Panel>

      {/* Reset Entire Event */}
      <Panel className="border-danger space-y-4">
        <h2 className="font-display text-xl uppercase text-danger font-black">
          RESET ENTIRE COMPETITION EVENT
        </h2>
        <p className="font-mono text-xs text-ink leading-relaxed">
          Resets all submissions, locks the case archive, unsets start/end deadlines, and returns the entire event to pre-event mode.
        </p>

        <Button
          variant="danger"
          size="sm"
          onClick={() => handleReset("EVENT")}
          isLoading={isProcessing}
          disabled={confirmInput !== "RESET"}
        >
          EXECUTE FULL EVENT RESET
        </Button>
      </Panel>

      {/* Rotate Session Secret Instructions */}
      <Panel className="space-y-3 bg-cream/40">
        <h2 className="font-display text-lg uppercase text-ink font-black">
          HOW TO ROTATE SESSION SECRETS & CODES (EMERGENCY)
        </h2>
        <div className="font-mono text-xs text-ink/80 space-y-2 leading-relaxed">
          <p>
            If the secret 5-character code or the session JWT key is suspected to be compromised:
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-2">
            <li>
              Generate a new code hash: <code>npm run hash:code</code> and enter a new 5-character code.
            </li>
            <li>
              Generate a new session key:{" "}
              <code>node -e &quot;console.log(require(&apos;crypto&apos;).randomBytes(32).toString(&apos;hex&apos;))&quot;</code>.
            </li>
            <li>
              Update <code>CODE_SALT</code>, <code>CODE_HASH</code>, and <code>SESSION_SECRET</code> in your Vercel/server environment.
            </li>
            <li>
              Redeploy the project. All previous team sessions will be immediately invalidated and require re-login.
            </li>
          </ol>
        </div>
      </Panel>
    </div>
  );
}
