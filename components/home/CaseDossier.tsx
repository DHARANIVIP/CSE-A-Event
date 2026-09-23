"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CaseFolder, Rulebook, Trophy, BadgeIcon } from "../icons";

export const CaseDossier: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "evidence" | "questions" | "rules">("overview");

  const evidenceFiles = [
    { name: "system_logs.txt", desc: "Firewall drop packets & syslog audit trail", size: "4,200 lines" },
    { name: "devices.csv", desc: "Terminal hostnames, MACs, IP addresses & VLAN tags", size: "320 records" },
    { name: "access_logs.csv", desc: "Physical badge room access & sensor checkpoints", size: "950 swipes" },
    { name: "login_logs.csv", desc: "SSO authentication sessions & privilege escalations", size: "1,840 logins" },
    { name: "network_traffic.csv", desc: "Packet payload metadata & exfiltration stream hashes", size: "12,500 packets" },
  ];

  const questionPreview = [
    { step: 1, title: "Rogue MAC Address", hint: "system_logs.txt" },
    { step: 2, title: "Compromised Terminal", hint: "devices.csv" },
    { step: 3, title: "Physical Badge Discrepancy", hint: "access_logs.csv" },
    { step: 4, title: "Staged Payload Script", hint: "login_logs.csv" },
    { step: 5, title: "Network Checksum Signature", hint: "network_traffic.csv" },
    { step: 6, title: "Firewall Alert Timestamp", hint: "system_logs.txt" },
    { step: 7, title: "Port Redirection Vector", hint: "network_traffic.csv" },
    { step: 8, title: "Privilege Escalation Role", hint: "login_logs.csv" },
    { step: 9, title: "VLAN Subnet Identifier", hint: "devices.csv" },
    { step: 10, title: "Sensor Verification Symbol", hint: "access_logs.csv" },
  ];

  return (
    <article className="relative w-full bg-[#EAD8B7] border-3 border-ink rounded-lg shadow-hard p-4 sm:p-6 overflow-hidden">
      {/* Top Manila Folder Tab & Red Stamp */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink/30 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-[#D9C198] border border-ink rounded-sm font-mono text-[11px] font-black text-ink uppercase tracking-wider shadow-sm">
            DOSSIER NO. 2026-CSE-01
          </span>
          <span className="font-mono text-xs font-bold text-muted hidden sm:inline">
            // DEPARTMENT OF CSE FORENSICS
          </span>
        </div>

        {/* Red Rubber Stamp */}
        <div className="px-3 py-0.5 border-2 border-crimson text-crimson rounded-sm font-mono text-[11px] font-black uppercase tracking-widest -rotate-2 select-none">
          ★ CONFIDENTIAL DISPATCH ★
        </div>
      </div>

      {/* Tab Navigation Strip */}
      <div className="flex flex-wrap gap-2 border-b-2 border-ink/20 pb-3">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-3 py-1.5 rounded font-mono text-xs font-bold uppercase transition-all border border-ink ${
            activeTab === "overview"
              ? "bg-crimson text-paper shadow-hard-sm"
              : "bg-paper text-ink hover:bg-cream"
          }`}
        >
          EVENT OVERVIEW
        </button>

        <button
          onClick={() => setActiveTab("evidence")}
          className={`px-3 py-1.5 rounded font-mono text-xs font-bold uppercase transition-all border border-ink ${
            activeTab === "evidence"
              ? "bg-crimson text-paper shadow-hard-sm"
              : "bg-paper text-ink hover:bg-cream"
          }`}
        >
          EVIDENCE DATASETS
        </button>

        <button
          onClick={() => setActiveTab("questions")}
          className={`px-3 py-1.5 rounded font-mono text-xs font-bold uppercase transition-all border border-ink ${
            activeTab === "questions"
              ? "bg-crimson text-paper shadow-hard-sm"
              : "bg-paper text-ink hover:bg-cream"
          }`}
        >
          10 DEDUCTION STEPS
        </button>

        <button
          onClick={() => setActiveTab("rules")}
          className={`px-3 py-1.5 rounded font-mono text-xs font-bold uppercase transition-all border border-ink ${
            activeTab === "rules"
              ? "bg-crimson text-paper shadow-hard-sm"
              : "bg-paper text-ink hover:bg-cream"
          }`}
        >
          SCORING & RULES
        </button>
      </div>

      {/* Tab 1: Event Overview */}
      {activeTab === "overview" && (
        <div className="pt-4 space-y-3 font-mono text-xs sm:text-sm text-ink leading-relaxed animate-fade-in">
          <h3 className="font-display text-2xl uppercase text-crimson font-black tracking-tight">
            DETECTRIX: CASE BRIEFING
          </h3>
          <p className="italic text-muted font-bold">
            &ldquo;Investigate. Connect. Decode. Unlock.&rdquo;
          </p>
          <p>
            <strong>DETECTRIX</strong> is an intensive, team-based digital forensics investigation challenge for second-year CSE students. Each team of <strong>4 members</strong> investigates a fictional digital breach using printed log files and sector captures to solve 10 connected questions and derive the master access code.
          </p>
          <p>
            The challenge tests observation, logical reasoning, teamwork, attention to detail, memory, and problem-solving under real-time event pressure. Official victory timestamps are determined strictly by authoritative server clocks.
          </p>
          <div className="pt-2">
            <Link
              href="/case"
              className="inline-flex items-center gap-1.5 text-crimson font-black hover:underline"
            >
              EXPLORE ACTIVE CASE EVIDENCE FILES →
            </Link>
          </div>
        </div>
      )}

      {/* Tab 2: Evidence Datasets */}
      {activeTab === "evidence" && (
        <div className="pt-4 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-ink/15 pb-2">
            <h3 className="font-display text-xl uppercase text-crimson font-black tracking-tight">
              PRIMARY CASE LOG FILES & DATASETS
            </h3>
            <span className="font-mono text-xs text-muted">5 Files Available</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {evidenceFiles.map((file) => (
              <div
                key={file.name}
                className="p-3 bg-paper/90 border-2 border-ink rounded shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-crimson">{file.name}</span>
                    <span className="font-mono text-[10px] text-muted font-bold">{file.size}</span>
                  </div>
                  <p className="font-mono text-xs text-ink/80 mt-1">{file.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-between items-center text-xs font-mono">
            <span className="text-muted">Available to all teams on login.</span>
            <Link href="/case" className="text-crimson font-black hover:underline">
              DOWNLOAD ZIP ARCHIVE IN CASE FILES →
            </Link>
          </div>
        </div>
      )}

      {/* Tab 3: 10 Deduction Steps */}
      {activeTab === "questions" && (
        <div className="pt-4 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-ink/15 pb-2">
            <h3 className="font-display text-xl uppercase text-crimson font-black tracking-tight">
              10 SEQUENTIAL INVESTIGATION QUESTIONS
            </h3>
            <span className="font-mono text-xs text-muted">Sequential Deduction</span>
          </div>

          <p className="font-mono text-xs text-ink">
            Each investigation question analyzes an evidence log file and deduces exactly one character of the access code:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {questionPreview.map((q) => (
              <div
                key={q.step}
                className="p-2.5 bg-paper/90 border border-ink rounded flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-crimson text-paper font-black text-[10px] flex items-center justify-center">
                    {q.step}
                  </span>
                  <span className="font-bold text-ink">{q.title}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 bg-cream border border-ink/30 rounded text-muted">
                  {q.hint}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 text-right">
            <Link href="/case" className="font-mono text-xs font-black text-crimson hover:underline">
              VIEW FULL QUESTION SUITE & INLINE CHECKERS →
            </Link>
          </div>
        </div>
      )}

      {/* Tab 4: Scoring & Rules */}
      {activeTab === "rules" && (
        <div className="pt-4 space-y-3 font-mono text-xs sm:text-sm text-ink leading-relaxed animate-fade-in">
          <h3 className="font-display text-xl uppercase text-crimson font-black tracking-tight">
            COMPETITION PROTOCOL & RULES
          </h3>

          <div className="overflow-x-auto border-2 border-ink rounded bg-paper shadow-sm">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-cream border-b border-ink">
                <tr>
                  <th className="p-2.5">RULE PARAMETER</th>
                  <th className="p-2.5">SPECIFICATION</th>
                </tr>
              </thead>
              <tbody className="divide-y border-ink/20">
                <tr>
                  <td className="p-2.5 font-bold">Team Composition</td>
                  <td className="p-2.5">Teams of 4 registered CSE students</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">Access Code Length</td>
                  <td className="p-2.5 font-bold text-crimson">5-Character Alphanumeric Code [A-Z0-9]</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">Submission Cooldown</td>
                  <td className="p-2.5">Lockout after 3 wrong attempts (escalating: 30s → 60s → 120s → 240s → 300s)</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">Authoritative Winning Rank</td>
                  <td className="p-2.5">Strictly determined by PostgreSQL timestamp (`clock_timestamp()`)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <span className="text-muted text-xs">Anti-bruteforce safeguards strictly enforced.</span>
            <Link href="/rules" className="text-crimson font-black hover:underline text-xs">
              READ COMPLETE OFFICIAL RULEBOOK →
            </Link>
          </div>
        </div>
      )}
    </article>
  );
};
