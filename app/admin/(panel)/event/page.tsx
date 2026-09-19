"use client";

import React, { useState, useEffect } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { InputBar } from "@/components/ui/InputBar";
import { formatInIST } from "@/lib/time";

export default function AdminEventControlPage() {
  const [eventState, setEventState] = useState<{
    start_at: string | null;
    end_at: string | null;
    force_status: string | null;
    case_released: boolean;
    case_sha256: string | null;
  } | null>(null);

  const [shaInput, setShaInput] = useState("");
  const [modalAction, setModalAction] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchState = async () => {
    try {
      const res = await fetch("/api/admin/event");
      if (res.ok) {
        const data = await res.json();
        setEventState(data.eventState);
        setShaInput(data.eventState.case_sha256 || "");
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  const triggerAction = async (action: string, payload: Record<string, unknown> = {}) => {
    setIsUpdating(true);
    try {
      const res = await fetch("/api/admin/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      if (res.ok) {
        const data = await res.json();
        setEventState(data.eventState);
      }
    } catch {
      // ignore
    } finally {
      setIsUpdating(false);
      setModalAction(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b-2 border-ink pb-3">
        <h1 className="font-display text-3xl uppercase text-crimson font-black tracking-tight">
          EVENT LIFECYCLE & TIMING CONTROL
        </h1>
        <p className="font-mono text-xs text-muted mt-1">
          Control session status, release case files, and extend competition deadlines.
        </p>
      </div>

      {/* Primary Lifecycle Actions */}
      <Panel className="space-y-4">
        <h2 className="font-display text-xl uppercase text-crimson font-black">
          LIFECYCLE TRIGGERS
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <Button
            variant="primary"
            onClick={() => setModalAction("START_NOW")}
            disabled={isUpdating}
          >
            START NOW
          </Button>

          <Button
            variant="secondary"
            onClick={() => setModalAction("PAUSE")}
            disabled={isUpdating}
          >
            PAUSE
          </Button>

          <Button
            variant="primary"
            onClick={() => setModalAction("RESUME")}
            disabled={isUpdating}
          >
            RESUME
          </Button>

          <Button
            variant="secondary"
            onClick={() => setModalAction("EXTEND_10M")}
            disabled={isUpdating}
          >
            +10 MIN
          </Button>

          <Button
            variant="danger"
            onClick={() => setModalAction("END_NOW")}
            disabled={isUpdating}
          >
            END NOW
          </Button>
        </div>
      </Panel>

      {/* Case Archive Release & SHA-256 Control */}
      <Panel className="space-y-4">
        <h2 className="font-display text-xl uppercase text-crimson font-black">
          CASE ARCHIVE RELEASE & INTEGRITY
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-cream border-2 border-ink rounded shadow-hard-sm">
          <div className="space-y-1">
            <span className="font-mono text-xs uppercase font-bold text-muted block">
              DOWNLOAD GATE STATUS
            </span>
            <span
              className={`font-mono text-sm font-black uppercase ${
                eventState?.case_released ? "text-success" : "text-danger"
              }`}
            >
              {eventState?.case_released ? "RELEASED (STUDENTS CAN DOWNLOAD)" : "LOCKED (RESTRICTED)"}
            </span>
          </div>

          <Button
            variant={eventState?.case_released ? "secondary" : "primary"}
            onClick={() => triggerAction("TOGGLE_CASE_RELEASE")}
            isLoading={isUpdating}
          >
            {eventState?.case_released ? "LOCK CASE FILES" : "RELEASE CASE FILES"}
          </Button>
        </div>

        <div className="space-y-3">
          <InputBar
            label="CASE ARCHIVE SHA-256 HASH"
            value={shaInput}
            onChange={(e) => setShaInput(e.target.value)}
            placeholder="e.g. e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
            hint="Displayed to students on the Case page for checksum integrity verification."
          />

          <Button
            variant="secondary"
            size="sm"
            onClick={() => triggerAction("SET_SHA256", { caseSha256: shaInput })}
            isLoading={isUpdating}
          >
            SAVE SHA-256 CHECKSUM
          </Button>
        </div>
      </Panel>

      {/* Confirmation Modal */}
      <Modal
        isOpen={modalAction !== null}
        onClose={() => setModalAction(null)}
        title="Confirm Event State Change"
      >
        <p className="mb-4">
          Are you sure you want to trigger <strong>{modalAction}</strong>? This immediately propagates to all connected team sessions.
        </p>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={() => setModalAction(null)}>
            CANCEL
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => modalAction && triggerAction(modalAction)}
            isLoading={isUpdating}
          >
            CONFIRM ACTION
          </Button>
        </div>
      </Modal>
    </div>
  );
}
