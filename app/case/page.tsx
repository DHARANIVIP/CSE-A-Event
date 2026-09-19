import React from "react";
import fs from "node:fs";
import path from "node:path";
import { redirect } from "next/navigation";
import { getTeamSession } from "@/lib/auth";
import { renderMarkdownToSafeHTML } from "@/lib/markdown";
import { Panel } from "@/components/ui/Panel";
import { PrintButton } from "@/components/ui/PrintButton";
import { CaseDownloadSection } from "@/components/case/CaseDownloadSection";
import { CheckpointsSection } from "@/components/case/CheckpointsSection";
import { mockDB } from "@/lib/supabase-server";
import { eventConfig } from "@/config/event.config";

export const dynamic = "force-dynamic";

export default async function CasePage() {
  const session = await getTeamSession();
  if (!session) {
    redirect("/enter?next=/case");
  }

  // Load content files safely from repository
  const briefingPath = path.resolve(process.cwd(), "content/case-briefing.md");
  const briefingRaw = fs.readFileSync(briefingPath, "utf-8");
  const briefingHTML = renderMarkdownToSafeHTML(briefingRaw);

  const questionsPath = path.resolve(process.cwd(), "content/questions.json");
  const questionsData = JSON.parse(fs.readFileSync(questionsPath, "utf-8"));

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-2">
      {/* Header Bar with Print Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-3 border-ink pb-4">
        <div>
          <span className="font-mono text-xs font-black text-crimson uppercase tracking-widest block">
            CLASSIFIED FORENSIC DOSSIER
          </span>
          <h1 className="font-display text-3xl sm:text-4xl text-crimson uppercase font-black tracking-tight">
            CASE FILES & EVIDENCE
          </h1>
        </div>

        <div className="flex items-center gap-3 no-print">
          <PrintButton />
        </div>
      </div>

      {/* 1. Case Briefing Narrative */}
      <Panel as="article" className="print:border-none print:shadow-none print:p-0">
        <div
          className="prose prose-neutral max-w-none font-mono"
          dangerouslySetInnerHTML={{ __html: briefingHTML }}
        />
      </Panel>

      {/* 2. Download Archive Section (Client Component) */}
      <Panel className="no-print">
        <h2 className="font-display text-2xl uppercase text-crimson font-black tracking-tight mb-4">
          FORENSIC EVIDENCE ARCHIVE
        </h2>
        <CaseDownloadSection
          caseReleased={mockDB.eventState.case_released}
          caseSha256={mockDB.eventState.case_sha256}
        />
      </Panel>

      {/* 3. The 5 Chained Investigative Questions */}
      <Panel as="section">
        <div className="border-b-2 border-ink/20 pb-3 mb-6">
          <h2 className="font-display text-2xl uppercase text-crimson font-black tracking-tight">
            THE 5 INVESTIGATIVE QUESTIONS
          </h2>
          <p className="font-mono text-xs sm:text-sm text-ink/80 mt-1">
            {questionsData.derivationRule}
          </p>
        </div>

        <div className="space-y-6">
          {questionsData.questions.map(
            (q: {
              id: string;
              step: number;
              title: string;
              fileHint: string;
              text: string;
              derivation: string;
            }) => (
              <div
                key={q.id}
                className="p-4 sm:p-5 bg-cream/50 border-2 border-ink rounded shadow-hard-sm space-y-2 relative"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-crimson text-paper font-mono text-xs font-black flex items-center justify-center border border-ink">
                      {q.step}
                    </span>
                    <h3 className="font-display text-lg uppercase text-crimson font-black tracking-tight">
                      {q.title}
                    </h3>
                  </div>

                  {q.fileHint && (
                    <span className="font-mono text-xs px-2 py-0.5 bg-paper border border-ink rounded text-ink font-bold">
                      FILE: {q.fileHint}
                    </span>
                  )}
                </div>

                <p className="font-mono text-sm text-ink leading-relaxed pt-1">{q.text}</p>

                <div className="pt-2 border-t border-ink/15 text-xs font-mono italic text-crimson-dark">
                  <strong>Derivation:</strong> {q.derivation}
                </div>
              </div>
            )
          )}
        </div>
      </Panel>

      {/* 4. Intermediate Checkpoints (Optional Feature, Section 12) */}
      {eventConfig.features.checkpointsEnabled && (
        <Panel className="no-print">
          <CheckpointsSection />
        </Panel>
      )}
    </div>
  );
}
