import React from "react";
import { Panel } from "@/components/ui/Panel";
import { Accordion } from "@/components/ui/Accordion";
import { eventConfig } from "@/config/event.config";

export default function HelpPage() {
  const faqItems = [
    {
      id: "faq-files",
      title: "WHERE DO WE GET THE CASE FILES?",
      content: (
        <p>
          Once the lead organizers trigger the case release, log in via your Team ID and PIN, navigate to the{" "}
          <a href="/case" className="text-crimson font-bold underline">
            Case Files
          </a>{" "}
          tab, and download the verified ZIP archive. If the download is locked, wait for the opening announcement.
        </p>
      ),
    },
    {
      id: "faq-box",
      title: "THE BOX WON'T ACCEPT OUR CODE — WHAT WENT WRONG?",
      content: (
        <p>
          Access codes are strictly 5 alphanumeric characters (A–Z, 0–9). If you see the message{" "}
          <em>&ldquo;THE BOX STAYS LOCKED,&rdquo;</em> the entered sequence was incorrect. Check your rate limit counter: consecutive wrong submissions activate escalating cooldown locks (30s, 60s, 120s, up to 300s).
        </p>
      ),
    },
    {
      id: "faq-pin",
      title: "OUR TEAM PIN DOES NOT WORK — WHAT SHOULD WE DO?",
      content: (
        <p>
          Ensure you are entering the 6-digit numeric PIN assigned to your printed team credential card. If you are locked out due to multiple failed attempts (5 attempts per 5 minutes), wait 5 minutes or approach the organizers desk to request a PIN reset.
        </p>
      ),
    },
    {
      id: "faq-tools",
      title: "WHAT TOOLS ARE PERMITTED DURING THE COMPETITION?",
      content: (
        <p>
          Any technical forensics utility is permitted: Python scripts, Jupyter Notebooks, pandas, SQL, terminal tools (grep, awk, sed, cut), Excel formulas, Wireshark, and modern generative AI models. The only restriction is that you cannot collaborate with other teams.
        </p>
      ),
    },
    {
      id: "faq-code",
      title: "WHAT CONSTITUTES A VALID CODE FORMAT?",
      content: (
        <p>
          The access code is exactly 5 alphanumeric characters without dashes, spaces, punctuation, or brackets (e.g. <code>K9X2P</code>). Letters are auto-converted to uppercase on submission.
        </p>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-2">
      <div className="border-b-3 border-ink pb-3 text-center sm:text-left">
        <span className="font-mono text-xs font-black text-crimson uppercase tracking-widest block">
          OPERATIONAL SUPPORT & FAQ
        </span>
        <h1 className="font-display text-3xl sm:text-4xl text-crimson uppercase font-black tracking-tight">
          INVESTIGATOR HELP DESK
        </h1>
      </div>

      {/* Frequently Asked Questions */}
      <Panel>
        <h2 className="font-display text-2xl uppercase text-crimson font-black tracking-tight mb-4">
          FREQUENTLY ASKED QUESTIONS
        </h2>
        <Accordion items={faqItems} />
      </Panel>

      {/* How the Server Timestamp Works Explainer (Section 8.8) */}
      <Panel className="bg-cream/40 space-y-3">
        <h2 className="font-display text-xl uppercase text-crimson font-black tracking-tight">
          HOW THE RANKING TIMESTAMP WORKS
        </h2>
        <p className="font-mono text-sm leading-relaxed text-ink">
          Official ranking is determined strictly by the <strong>PostgreSQL server clock</strong> (via <code>clock_timestamp()</code>) inside an isolated serializable transaction lock. 
        </p>
        <ul className="list-disc list-inside font-mono text-xs text-ink/80 space-y-1.5 pl-2">
          <li>Local workstation clocks or timezones have zero influence on ranking.</li>
          <li>In the event of concurrent submissions, the database advisory lock guarantees strict millisecond sequencing.</li>
          <li>All results are displayed in Indian Standard Time (IST, UTC+5:30) with millisecond precision.</li>
        </ul>
      </Panel>

      {/* Organizer Emergency Contact */}
      <Panel className="space-y-2">
        <h2 className="font-display text-lg uppercase text-crimson font-black tracking-tight">
          PHYSICAL HELP DESK & ORGANIZERS
        </h2>
        <p className="font-mono text-xs text-ink leading-relaxed">
          If your workstation experiences total network loss, approach the front coordinator desk. If the portal becomes unreachable due to lab Wi-Fi failure, hand in your derived 5-character code on the official printed team card for manual timestamping.
        </p>
        <div className="pt-2 font-mono text-xs font-bold text-muted">
          Organized by: <span className="text-ink">{eventConfig.organizerTeam}</span> · Room: Central Computing Facility 3
        </div>
      </Panel>
    </div>
  );
}
