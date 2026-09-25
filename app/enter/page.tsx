"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { InputBar } from "@/components/ui/InputBar";
import { Button } from "@/components/ui/Button";
import { DetectiveHat } from "@/components/brand/DetectiveHat";

function EnterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") || "/case";

  // Validate nextParam to prevent open redirects (must be relative same-origin path)
  const safeNext = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/case";

  const [teamId, setTeamId] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [currentSession, setCurrentSession] = useState<{ id: string; name: string; members: string[] } | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.team) setCurrentSession(data.team);
      })
      .catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setRetryAfter(null);

    const cleanIdentifier = teamId.trim();
    const cleanPin = pin.trim();

    if (!cleanIdentifier || cleanPin.length < 4) {
      setErrorMsg("Please enter your Student Roll No (or Email / Team ID) and Password.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: cleanIdentifier, pin: cleanPin }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429 && data.error?.retryAfterSeconds) {
          setRetryAfter(data.error.retryAfterSeconds);
          setErrorMsg(data.error.message || `Rate limited. Try again in ${data.error.retryAfterSeconds}s.`);
        } else {
          setErrorMsg(data.error?.message || "Invalid credentials. Please verify your badge details.");
        }
        setIsLoading(false);
        return;
      }

      // Success -> navigate to target page
      router.push(safeNext);
      router.refresh();
    } catch {
      setErrorMsg("Connection interrupted. Check Wi-Fi signal and retry.");
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    setCurrentSession(null);
    router.refresh();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-6">
      <Panel className="max-w-md w-full">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-3 bg-cream rounded-full border-2 border-ink shadow-hard-sm mb-3">
            <DetectiveHat size={44} />
          </div>
          <h1 className="font-display text-3xl uppercase text-crimson font-black tracking-tight">
            INVESTIGATOR ACCESS
          </h1>
          <p className="font-mono text-xs text-muted mt-1 uppercase tracking-wider">
            Enter your student Roll No / Email ID and assigned password
          </p>
        </div>

        {currentSession ? (
          <div className="space-y-4 text-center">
            <div className="bg-cream border-2 border-ink rounded p-4 shadow-hard-sm">
              <span className="font-mono text-xs font-bold text-muted uppercase block">
                CURRENTLY AUTHENTICATED
              </span>
              <h2 className="font-display text-2xl text-crimson font-black uppercase mt-1">
                {currentSession.name}
              </h2>
              <span className="font-mono text-xs font-bold text-ink uppercase">
                ID: {currentSession.id}
              </span>
              {currentSession.members?.length > 0 && (
                <div className="mt-2 text-xs font-mono text-muted">
                  Investigators: {currentSession.members.join(", ")}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => router.push(safeNext)}
              >
                GO TO CASE FILES
              </Button>
              <Button variant="secondary" onClick={handleLogout}>
                LOGOUT
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <InputBar
              label="STUDENT ROLL NO, EMAIL ID, OR TEAM ID"
              placeholder="e.g. 12345678901, student@ksrce.ac.in, or DTX-01"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
              required
            />

            <div className="relative">
              <InputBar
                label="PASSWORD"
                placeholder="Enter password assigned to your account"
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoComplete="off"
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-9 text-xs font-mono font-bold text-crimson hover:underline select-none"
              >
                {showPin ? "HIDE" : "SHOW"}
              </button>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="p-3 bg-danger/10 border-2 border-danger rounded text-danger font-mono text-xs font-bold leading-relaxed"
              >
                {errorMsg}
                {retryAfter && (
                  <span className="block mt-1 text-[11px] text-muted">
                    Lockout active: {retryAfter} seconds remaining.
                  </span>
                )}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              ACCESS CASE STATION
            </Button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-ink/20 text-center font-mono text-[11px] text-muted">
          <span>Need your team badge or PIN? Approach the </span>
          <span className="text-crimson font-bold">Front Organizer Desk</span>
          <span>.</span>
        </div>
      </Panel>
    </div>
  );
}

export default function EnterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh] font-mono text-sm">
          LOADING CASE ACCESS...
        </div>
      }
    >
      <EnterForm />
    </Suspense>
  );
}
