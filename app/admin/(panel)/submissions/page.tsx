"use client";

import React, { useState, useEffect } from "react";
import { Panel } from "@/components/ui/Panel";
import { Table, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { InputBar } from "@/components/ui/InputBar";

interface SubmissionItem {
  id: string;
  teamId: string;
  teamName: string;
  isCorrect: boolean;
  createdAt: string;
  createdAtFormatted: string;
  attemptHashShort: string | null;
  ipHashShort: string | null;
  isSuspicious: boolean;
  wrongAttemptsCount: number;
}

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [filterTeam, setFilterTeam] = useState("");

  const fetchSubmissions = async () => {
    try {
      const url = filterTeam
        ? `/api/admin/submissions?teamId=${encodeURIComponent(filterTeam)}`
        : "/api/admin/submissions";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchSubmissions();
    const interval = setInterval(fetchSubmissions, 15000);
    return () => clearInterval(interval);
  }, [filterTeam]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-ink pb-3">
        <div>
          <h1 className="font-display text-3xl uppercase text-crimson font-black tracking-tight">
            SUBMISSION AUDIT TRAIL
          </h1>
          <p className="font-mono text-xs text-muted mt-1">
            Real-time forensic verification log of all team attempts with cryptographic attempt hashes.
          </p>
        </div>

        <a
          href="/api/admin/submissions?format=csv"
          className="px-3 py-1.5 bg-cream text-ink border-2 border-ink rounded font-mono text-xs font-bold uppercase shadow-hard-sm hover:shadow-hard self-start sm:self-auto"
        >
          EXPORT CSV AUDIT
        </a>
      </div>

      <Panel className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="max-w-xs w-full">
            <InputBar
              placeholder="Filter by Team ID..."
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
            />
          </div>
          <span className="font-mono text-xs text-muted">
            TOTAL LOGGED ATTEMPTS: {submissions.length}
          </span>
        </div>

        <Table headers={["TIME (IST)", "TEAM", "RESULT", "ATTEMPT HASH", "IP HASH", "FLAGS"]}>
          {submissions.length === 0 ? (
            <TableRow>
              <TableCell className="text-center py-6 text-muted" colSpan={6}>
                No submissions logged in this sector yet.
              </TableCell>
            </TableRow>
          ) : (
            submissions.map((sub) => (
              <TableRow key={sub.id} className={sub.isCorrect ? "bg-gold/20" : ""}>
                <TableCell className="font-mono text-xs">
                  {sub.createdAtFormatted}
                </TableCell>
                <TableCell className="font-bold">
                  <span>{sub.teamName}</span>
                  <span className="text-[10px] text-muted block font-mono">
                    {sub.teamId}
                  </span>
                </TableCell>
                <TableCell>
                  {sub.isCorrect ? (
                    <Badge variant="success">CORRECT ✓</Badge>
                  ) : (
                    <Badge variant="crimson">WRONG ✕</Badge>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {sub.attemptHashShort ? (
                    <code>{sub.attemptHashShort}...</code>
                  ) : (
                    <span className="text-muted">--</span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {sub.ipHashShort ? <code>{sub.ipHashShort}...</code> : "--"}
                </TableCell>
                <TableCell>
                  {sub.isSuspicious ? (
                    <span
                      className="px-1.5 py-0.5 bg-danger text-paper font-mono text-[10px] font-black rounded border border-ink"
                      title={`${sub.wrongAttemptsCount} wrong attempts - Possible brute-force anomaly`}
                    >
                      🚩 {sub.wrongAttemptsCount} WRONG
                    </span>
                  ) : (
                    <span className="text-muted font-mono text-xs">--</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </Table>
      </Panel>
    </div>
  );
}
