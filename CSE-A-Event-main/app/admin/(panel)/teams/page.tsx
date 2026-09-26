"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Table, TableRow, TableCell } from "@/components/ui/Table";
import { InputBar } from "@/components/ui/InputBar";
import { Modal } from "@/components/ui/Modal";

interface TeamItem {
  id: string;
  name: string;
  members: string[];
  disabled: boolean;
  createdAt: string;
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");
  const [loading, setLoading] = useState(true);

  const [regeneratedPinModal, setRegeneratedPinModal] = useState<{
    teamId: string;
    pin: string;
  } | null>(null);

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/admin/teams");
      if (res.ok) {
        const data = await res.json();
        setTeams(data.teams || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleToggleDisable = async (teamId: string) => {
    try {
      await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_DISABLE", teamId }),
      });
      fetchTeams();
    } catch {
      // ignore
    }
  };

  const handleRegeneratePin = async (teamId: string) => {
    try {
      const res = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REGENERATE_PIN", teamId }),
      });
      if (res.ok) {
        const data = await res.json();
        setRegeneratedPinModal({ teamId, pin: data.newPin });
      }
    } catch {
      // ignore
    }
  };

  // Compute aggregate statistics
  const totalStudents = teams.reduce((acc, t) => acc + (t.members?.length || 0), 0);
  const activeTeams = teams.filter((t) => !t.disabled).length;
  const suspendedTeams = teams.filter((t) => t.disabled).length;

  // Filtered teams list based on search and status
  const filteredTeams = teams.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.members.some((m) => m.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === "ACTIVE") return !t.disabled;
    if (statusFilter === "SUSPENDED") return t.disabled;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-ink pb-3">
        <div>
          <span className="font-mono text-xs font-black text-crimson uppercase tracking-widest block">
            REGISTRATION DIRECTORY
          </span>
          <h1 className="font-display text-3xl uppercase text-crimson font-black tracking-tight">
            REGISTERED STUDENTS & TEAMS
          </h1>
          <p className="font-mono text-xs text-muted mt-0.5">
            Verified roster of student investigators, team allocations, and credential status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/teams/print"
            target="_blank"
            className="px-3.5 py-2 bg-crimson text-paper border-2 border-ink rounded font-mono text-xs font-black uppercase shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 active:translate-y-0.5 transition-all select-none"
          >
            PRINT PASSES (QR CODES)
          </Link>

          <a
            href="/api/admin/teams?format=csv"
            className="px-3.5 py-2 bg-cream text-ink border-2 border-ink rounded font-mono text-xs font-black uppercase shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 active:translate-y-0.5 transition-all select-none"
          >
            EXPORT CSV
          </a>
        </div>
      </div>

      {/* 3 Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-paper border-2 border-ink rounded shadow-hard-sm">
          <span className="font-mono text-[10px] uppercase font-bold text-muted block">
            TOTAL ENROLLED STUDENTS
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-display text-3xl text-crimson font-black">
              {totalStudents}
            </span>
            <span className="font-mono text-xs text-muted">participants</span>
          </div>
        </div>

        <div className="p-3.5 bg-paper border-2 border-ink rounded shadow-hard-sm">
          <span className="font-mono text-[10px] uppercase font-bold text-muted block">
            REGISTERED TEAMS
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-display text-3xl text-ink font-black">
              {teams.length}
            </span>
            <span className="font-mono text-xs text-muted">rosters</span>
          </div>
        </div>

        <div className="p-3.5 bg-paper border-2 border-ink rounded shadow-hard-sm">
          <span className="font-mono text-[10px] uppercase font-bold text-muted block">
            ROSTER STATUS
          </span>
          <div className="flex items-center gap-3 mt-1.5 font-mono text-xs font-bold">
            <span className="text-success">
              ● {activeTeams} ACTIVE
            </span>
            {suspendedTeams > 0 && (
              <span className="text-danger">
                ● {suspendedTeams} SUSPENDED
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Student Directory Table */}
      <Panel className="space-y-4">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink/15 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl uppercase text-crimson font-black">
              STUDENT ROSTER ({filteredTeams.length} TEAMS)
            </h2>
            <div className="flex rounded border border-ink overflow-hidden text-[11px] font-mono font-bold">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-2.5 py-1 ${statusFilter === "ALL" ? "bg-crimson text-paper" : "bg-cream text-ink"}`}
              >
                ALL
              </button>
              <button
                onClick={() => setStatusFilter("ACTIVE")}
                className={`px-2.5 py-1 ${statusFilter === "ACTIVE" ? "bg-crimson text-paper" : "bg-cream text-ink"}`}
              >
                ACTIVE
              </button>
              <button
                onClick={() => setStatusFilter("SUSPENDED")}
                className={`px-2.5 py-1 ${statusFilter === "SUSPENDED" ? "bg-crimson text-paper" : "bg-cream text-ink"}`}
              >
                SUSPENDED
              </button>
            </div>
          </div>

          <div className="max-w-xs w-full">
            <InputBar
              placeholder="Search student name or team..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center font-mono text-xs text-muted">
            LOADING REGISTERED STUDENT DIRECTORY...
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="p-8 text-center font-mono text-xs text-muted">
            NO REGISTERED STUDENTS MATCHING QUERY.
          </div>
        ) : (
          <Table headers={["TEAM ID", "TEAM NAME", "REGISTERED STUDENT INVESTIGATORS", "STATUS", "ACTIONS"]}>
            {filteredTeams.map((team) => (
              <TableRow key={team.id} className={team.disabled ? "opacity-60 bg-danger/5" : ""}>
                <TableCell className="font-mono font-black text-ink whitespace-nowrap">
                  <span className="px-2 py-1 bg-cream border border-ink rounded text-xs shadow-sm">
                    {team.id}
                  </span>
                </TableCell>

                <TableCell className="font-bold text-ink">
                  <span>{team.name}</span>
                </TableCell>

                <TableCell>
                  {team.members && team.members.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5 py-1">
                      {team.members.map((member, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-paper border border-ink/40 rounded-sm font-mono text-xs font-bold text-ink shadow-sm"
                        >
                          {member}
                        </span>
                      ))}
                      <span className="text-[10px] font-mono text-muted font-bold ml-1">
                        ({team.members.length})
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted font-mono text-xs">No students listed</span>
                  )}
                </TableCell>

                <TableCell>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase border ${
                      team.disabled
                        ? "bg-danger/20 text-danger border-danger"
                        : "bg-success/20 text-success border-success"
                    }`}
                  >
                    {team.disabled ? "SUSPENDED" : "ACTIVE"}
                  </span>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRegeneratePin(team.id)}
                      className="px-2 py-1 bg-cream border border-ink rounded font-mono text-[10px] font-bold uppercase hover:bg-paper hover:border-crimson transition-colors shadow-sm"
                      title="Generate new 6-digit access PIN"
                    >
                      RESET PIN
                    </button>
                    <button
                      onClick={() => handleToggleDisable(team.id)}
                      className={`px-2 py-1 border rounded font-mono text-[10px] font-bold uppercase transition-colors shadow-sm ${
                        team.disabled
                          ? "bg-success text-paper border-ink hover:bg-success/90"
                          : "bg-cream text-danger border-ink hover:bg-danger hover:text-paper"
                      }`}
                    >
                      {team.disabled ? "ACTIVATE" : "SUSPEND"}
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </Panel>

      {/* Regenerated PIN Alert Modal */}
      <Modal
        isOpen={regeneratedPinModal !== null}
        onClose={() => setRegeneratedPinModal(null)}
        title="Access PIN Regenerated"
      >
        <p className="mb-2 font-mono text-xs text-ink">
          New access PIN for team <strong>{regeneratedPinModal?.teamId}</strong>:
        </p>
        <div className="p-3 bg-cream border-2 border-ink rounded text-center font-mono text-3xl font-black text-crimson mb-3 select-all tracking-widest shadow-inner">
          {regeneratedPinModal?.pin}
        </div>
        <p className="font-mono text-xs text-muted mb-4 leading-relaxed">
          Provide this 6-digit numeric PIN to the registered student investigators. It is stored hashed and cannot be retrieved again once dismissed.
        </p>
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              if (regeneratedPinModal?.pin) {
                navigator.clipboard.writeText(regeneratedPinModal.pin);
              }
            }}
          >
            COPY PIN
          </Button>
          <Button size="sm" variant="primary" onClick={() => setRegeneratedPinModal(null)}>
            DISMISS
          </Button>
        </div>
      </Modal>
    </div>
  );
}
