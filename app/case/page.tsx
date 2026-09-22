import React from "react";
import path from "node:path";
import fs from "node:fs";
import { redirect } from "next/navigation";
import { getTeamSession } from "@/lib/auth";
import { Panel } from "@/components/ui/Panel";
import { QuestionList } from "@/components/case/QuestionList";
import { mockDB } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function CasePage() {
  const session = await getTeamSession();
  if (!session) {
    redirect("/enter?next=/case");
  }

  // Check admin-controlled question visibility state
  const isQuestionsVisible = Boolean(mockDB.eventState.case_released);

  // Load 10 investigation questions
  const questionsPath = path.resolve(process.cwd(), "content/questions.json");
  const questionsData = JSON.parse(fs.readFileSync(questionsPath, "utf-8"));

  const logFiles = [
    { name: "system_logs.txt", desc: "Firewall drop rules & auth daemon alerts", size: "~4,200 lines" },
    { name: "devices.csv", desc: "DHCP lease mappings, MACs & VLAN IDs", size: "150 rows" },
    { name: "access_logs.csv", desc: "Physical room badge reader logs", size: "620 rows" },
    { name: "login_logs.csv", desc: "SSO authentication sessions & logins", size: "1,840 rows" },
    { name: "network_traffic.csv", desc: "Packet payload metadata & checksums", size: "12,500 rows" },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-2">
      {/* Header Bar */}
      <div className="border-b-3 border-ink pb-3">
        <span className="font-mono text-xs font-black text-crimson uppercase tracking-widest block">
          DETECTRIX FORENSIC STATION
        </span>
        <h1 className="font-display text-3xl sm:text-4xl text-crimson uppercase font-black tracking-tight mt-0.5">
          CASE FILES & EVIDENCE
        </h1>
      </div>

      {/* 1. Case Files Names & Datasets (First Section) */}
      <Panel as="section" className="space-y-4">
        <div className="border-b-2 border-ink/20 pb-3">
          <span className="font-mono text-xs font-black text-crimson uppercase tracking-wider block">
            PRIMARY INVESTIGATION MATERIAL
          </span>
          <h2 className="font-display text-2xl uppercase text-crimson font-black tracking-tight mt-0.5">
            EVENT CASE FILES & DATASETS
          </h2>
          <p className="font-mono text-xs sm:text-sm text-ink/80 mt-1">
            Examine these 5 evidence datasets to analyze the digital incident and derive the lock code.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {logFiles.map((file) => (
            <div
              key={file.name}
              className="p-3 bg-cream/70 border-2 border-ink rounded shadow-hard-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-crimson uppercase">{file.name}</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 bg-paper border border-ink rounded text-muted font-bold">
                    {file.size}
                  </span>
                </div>
                <p className="font-mono text-xs text-ink/90 mt-1">{file.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 bg-cream border-2 border-ink rounded p-3 shadow-hard-sm">
          <span className="font-mono text-xs font-bold text-ink">
            OFFICIAL CASE ARCHIVE: <span className="text-crimson">mystery-case-archive.zip</span>
          </span>
          <a
            href="/api/case-download"
            className="px-4 py-2 bg-crimson text-paper border-2 border-ink rounded font-mono text-xs font-bold uppercase tracking-wider hover:bg-crimson-dark transition-colors shadow-hard-sm"
          >
            DOWNLOAD CASE ARCHIVE (.ZIP)
          </a>
        </div>
      </Panel>

      {/* 2. 10 Investigation Questions with Inline Answer Checkers */}
      <Panel as="section">
        <div className="border-b-2 border-ink/20 pb-3 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-mono text-xs font-black text-crimson uppercase tracking-wider block">
                SEQUENTIAL DEDUCTION PROTOCOL
              </span>
              <h2 className="font-display text-2xl uppercase text-crimson font-black tracking-tight mt-0.5">
                10 INVESTIGATION QUESTIONS
              </h2>
            </div>
            <span
              className={`font-mono text-xs font-bold px-2.5 py-1 rounded border border-ink ${
                isQuestionsVisible ? "bg-success/20 text-success border-success" : "bg-warning/20 text-warning border-warning"
              }`}
            >
              {isQuestionsVisible ? "QUESTIONS OPEN" : "QUESTIONS LOCKED BY ADMIN"}
            </span>
          </div>

          {isQuestionsVisible && (
            <p className="font-mono text-xs sm:text-sm text-ink/80 mt-2">
              {questionsData.derivationRule}
            </p>
          )}
        </div>

        {isQuestionsVisible ? (
          <QuestionList questions={questionsData.questions} />
        ) : (
          <div className="p-6 bg-cream border-2 border-dashed border-ink/40 rounded text-center space-y-3">
            <div className="font-mono text-sm font-bold text-crimson uppercase tracking-wider">
              INVESTIGATION QUESTIONS RESTRICTED
            </div>
            <p className="font-mono text-xs sm:text-sm text-ink max-w-lg mx-auto leading-relaxed">
              Investigation questions will appear when the case is opened by the admin.
            </p>
            <p className="font-mono text-xs text-muted">
              You can examine the log files and evidence material above while waiting for the questions to be released.
            </p>
          </div>
        )}
      </Panel>
    </div>
  );
}
