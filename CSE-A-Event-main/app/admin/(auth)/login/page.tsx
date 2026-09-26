"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { InputBar } from "@/components/ui/InputBar";
import { Button } from "@/components/ui/Button";
import { Padlock } from "@/components/icons";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error?.message || "Invalid administrator credentials.");
        setIsLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setErrorMsg("Network error connecting to security server.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-6">
      <Panel className="max-w-md w-full">
        {/* Crimson Admin Strip */}
        <div className="bg-crimson text-paper py-1 px-3 -mx-5 -mt-5 mb-5 border-b-3 border-ink text-center font-mono text-xs font-black uppercase tracking-widest">
          ORGANIZER SECURE GATEWAY
        </div>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-3 bg-cream rounded-full border-2 border-ink shadow-hard-sm mb-2">
            <Padlock size={36} />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl uppercase text-crimson font-black tracking-tight">
            ADMINISTRATOR ACCESS
          </h1>
          <p className="font-mono text-xs text-muted mt-1">
            Access event control, team rosters, and verification tools.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputBar
            label="ADMINISTRATOR MASTER PASSWORD"
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {errorMsg && (
            <div
              role="alert"
              className="p-3 bg-danger/10 border-2 border-danger rounded text-danger font-mono text-xs font-bold"
            >
              {errorMsg}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            isLoading={isLoading}
          >
            ENTER ADMIN STATION
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-ink/20 text-center font-mono text-[11px] text-muted">
          All authentication attempts are logged and rate-limited.
        </div>
      </Panel>
    </div>
  );
}
