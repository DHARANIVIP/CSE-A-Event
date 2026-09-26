import React from "react";
import fs from "node:fs";
import path from "node:path";
import { renderMarkdownToSafeHTML } from "@/lib/markdown";
import { Panel } from "@/components/ui/Panel";
import { RulesCheckbox } from "@/components/rules/RulesCheckbox";

export default function RulesPage() {
  const rulesPath = path.resolve(process.cwd(), "content/rules.md");
  const rulesRaw = fs.readFileSync(rulesPath, "utf-8");
  const rulesHTML = renderMarkdownToSafeHTML(rulesRaw);

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-2">
      <div className="border-b-3 border-ink pb-3 text-center sm:text-left">
        <span className="font-mono text-xs font-black text-crimson uppercase tracking-widest block">
          INVESTIGATION PROTOCOLS
        </span>
        <h1 className="font-display text-3xl sm:text-4xl text-crimson uppercase font-black tracking-tight">
          RULES OF ENGAGEMENT
        </h1>
      </div>

      <Panel as="article">
        <div
          className="prose prose-neutral max-w-none font-mono text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: rulesHTML }}
        />
      </Panel>

      {/* Local Acknowledgement Checkbox (Section 8.4) */}
      <Panel className="bg-cream/40">
        <RulesCheckbox />
      </Panel>
    </div>
  );
}
