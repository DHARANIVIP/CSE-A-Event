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
  const [csvContent, setCsvContent] = useState("");
  const [importReport, setImportReport] = useState<{
    count: number;
    errors: string[];
    teamsWithPins?: Array<{ id: string; name: string; pin: string }>;
  } | null>(null);

  const [regeneratedPinModal, setRegeneratedPinModal] = useState<{
    teamId: string;
    pin: string;
  } | null>(null);

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/admin/teams");
      if (res.ok) {
        const data = await res.json();
        setTeams(data.teams);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleImportCSV = async () => {
    if (!csvContent.trim()) return;

    try {
      const res = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "IMPORT_CSV", csvContent }),
      });

      const data = await res.json();
      if (res.ok) {
        setImportReport({
          count: data.importedCount,
          errors: data.errors || [],
          teamsWithPins: data.teamsWithPins,
        });
        setCsvContent("");
        fetchTeams();
      }
    } catch {
      // ignore
    }
  };

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

  const filteredTeams = teams.filter(
    (t) =>
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-ink pb-3">
        <div>
          <h1 className="font-display text-3xl uppercase text-crimson font-black tracking-tight">
            TEAMS & ACCESS MANAGEMENT
          </h1>
          <p className="font-mono text-xs text-muted mt-1">
            Import team CSV rosters, manage PIN credentials, and generate printable team passes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/teams/print"
            target="_blank"
            className="px-3 py-1.5 bg-crimson text-paper border-2 border-ink rounded font-mono text-xs font-bold uppercase shadow-hard-sm hover:shadow-hard"
          >
            PRINT TEAM PASSES
          </Link>

          <a
            href="/api/admin/teams?format=csv"
            className="px-3 py-1.5 bg-cream text-ink border-2 border-ink rounded font-mono text-xs font-bold uppercase shadow-hard-sm hover:shadow-hard"
          >
            EXPORT CSV
          </a>
        </div>
      </div>

      {/* CSV Import Panel */}
      <Panel className="space-y-4">
        <h2 className="font-display text-xl uppercase text-crimson font-black">
          BATCH CSV ROSTER IMPORT
        </h2>
        <p className="font-mono text-xs text-muted">
          Format: <code>team_id, team_name, member1;member2, optional_pin</code>. If PIN is omitted, a random 6-digit PIN is generated.
        </p>

        <textarea
          rows={4}
          value={csvContent}
          onChange={(e) => setCsvContent(e.target.value)}
          placeholder={`team_id,team_name,members,pin\nTEAM-01,Cipher Enigma,Alice;Bob;Charlie,123456\nTEAM-02,Binary Shadows,David;Eva;Frank,`}
          className="w-full bg-cream border-2 border-ink rounded p-3 font-mono text-xs text-ink placeholder:text-muted/60 focus:ring-2 focus:ring-crimson focus:outline-none"
        />

        <Button variant="primary" size="sm" onClick={handleImportCSV}>
          PROCESS & IMPORT ROSTER
        </Button>

        {importReport && (
          <div className="p-4 bg-paper border-2 border-ink rounded shadow-hard-sm space-y-2">
            <span className="font-mono text-xs font-bold text-success uppercase block">
              ✓ Successfully imported {importReport.count} teams.
            </span>
            {importReport.errors.length > 0 && (
              <div className="text-xs font-mono text-danger">
                {importReport.errors.map((e, i) => (
                  <div key={i}>• {e}</div>
                ))}
              </div>
            )}
            {importReport.teamsWithPins && importReport.teamsWithPins.length > 0 && (
              <div className="mt-3">
                <span className="font-mono text-xs font-black uppercase text-crimson block mb-1">
                  NEW ASSIGNED PASSWORDS (PRINT OR SAVE NOW):
                </span>
                <div className="max-h-40 overflow-y-auto bg-cream p-2 border border-ink rounded font-mono text-xs">
                  {importReport.teamsWithPins.map((t) => (
                    <div key={t.id} className="flex justify-between py-0.5 border-b border-ink/10">
                      <span>{t.id} ({t.name})</span>
                      <strong className="text-crimson font-mono">{t.pin}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Panel>

      {/* Teams Search & Roster Table */}
      <Panel className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-display text-xl uppercase text-crimson font-black">
            ROSTER DIRECTORY ({teams.length})
          </h2>

          <div className="max-w-xs w-full">
            <InputBar
              placeholder="Search team ID or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Table headers={["TEAM ID", "TEAM NAME", "MEMBERS", "STATUS", "ACTIONS"]}>
          {filteredTeams.map((team) => (
            <TableRow key={team.id} className={team.disabled ? "opacity-50" : ""}>
              <TableCell className="font-mono font-black">{team.id}</TableCell>
              <TableCell className="font-bold">{team.name}</TableCell>
              <TableCell className="text-xs">{team.members.join(", ") || "--"}</TableCell>
              <TableCell>
                <span
                  className={`text-xs font-mono font-bold uppercase ${
                    team.disabled ? "text-danger" : "text-success"
                  }`}
                >
                  {team.disabled ? "SUSPENDED" : "ACTIVE"}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRegeneratePin(team.id)}
                    className="px-2 py-1 bg-cream border border-ink rounded font-mono text-[10px] font-bold uppercase hover:bg-paper"
                  >
                    RESET PIN
                  </button>
                  <button
                    onClick={() => handleToggleDisable(team.id)}
                    className="px-2 py-1 bg-cream border border-ink rounded font-mono text-[10px] font-bold uppercase hover:bg-paper text-danger"
                  >
                    {team.disabled ? "ACTIVATE" : "SUSPEND"}
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      </Panel>

      {/* Regenerated PIN Alert Modal */}
      <Modal
        isOpen={regeneratedPinModal !== null}
        onClose={() => setRegeneratedPinModal(null)}
        title="PIN Regenerated"
      >
        <p className="mb-2">
          New access PIN for team <strong>{regeneratedPinModal?.teamId}</strong>:
        </p>
        <div className="p-3 bg-cream border-2 border-ink rounded text-center font-mono text-2xl font-black text-crimson mb-4 select-all">
          {regeneratedPinModal?.pin}
        </div>
        <p className="font-mono text-xs text-muted mb-4">
          Provide this 6-digit numeric PIN to the team lead. It cannot be viewed again once dismissed.
        </p>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setRegeneratedPinModal(null)}>
            DISMISS
          </Button>
        </div>
      </Modal>
    </div>
  );
}
