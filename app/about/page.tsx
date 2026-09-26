import React from "react";
import fs from "node:fs";
import path from "node:path";
import { renderMarkdownToSafeHTML } from "@/lib/markdown";
import { Panel } from "@/components/ui/Panel";
import { eventConfig } from "@/config/event.config";

export default function AboutPage() {
  const aboutPath = path.resolve(process.cwd(), "content/about.md");
  let aboutHTML = "";
  if (fs.existsSync(aboutPath)) {
    const raw = fs.readFileSync(aboutPath, "utf-8");
    aboutHTML = renderMarkdownToSafeHTML(
      raw
        .replace(/{TEAM_NAME}/g, eventConfig.organizerTeam)
        .replace(/{COLLEGE_NAME}/g, eventConfig.collegeName)
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-2">
      <div className="border-b-3 border-ink pb-3 text-center sm:text-left">
        <span className="font-mono text-xs font-black text-crimson uppercase tracking-widest block">
          EVENT BRIEF & PHILOSOPHY
        </span>
        <h1 className="font-display text-3xl sm:text-4xl text-crimson uppercase font-black tracking-tight">
          ABOUT THE DIGITAL CASE
        </h1>
      </div>

      <Panel as="article">
        <div
          className="prose prose-neutral max-w-none font-mono text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: aboutHTML }}
        />
      </Panel>

      <Panel className="bg-cream/40 space-y-3">
        <h2 className="font-display text-xl uppercase text-crimson font-black tracking-tight">
          EVENT QUICK SPECS
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs text-ink">
          <div className="p-3 bg-paper border border-ink/20 rounded">
            <span className="font-bold text-muted uppercase block">TARGET COHORT</span>
            <span className="font-bold text-ink">{eventConfig.audience}</span>
          </div>
          <div className="p-3 bg-paper border border-ink/20 rounded">
            <span className="font-bold text-muted uppercase block">SESSION WINDOW</span>
            <span className="font-bold text-ink">{eventConfig.expectedDuration}</span>
          </div>
          <div className="p-3 bg-paper border border-ink/20 rounded">
            <span className="font-bold text-muted uppercase block">COORDINATORS</span>
            <span className="font-bold text-ink">{eventConfig.organizerTeam}</span>
          </div>
          <div className="p-3 bg-paper border border-ink/20 rounded">
            <span className="font-bold text-muted uppercase block">ACADEMIC DEPARTMENT</span>
            <span className="font-bold text-ink">{eventConfig.collegeName}</span>
          </div>
        </div>
      </Panel>
    </div>
  );
}
