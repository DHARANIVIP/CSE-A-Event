import React from "react";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { Magnifier } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Panel className="max-w-md w-full flex flex-col items-center space-y-4">
        <div className="p-4 bg-cream rounded-full border-3 border-ink shadow-hard-sm">
          <Magnifier size={64} />
        </div>

        <h1 className="font-display text-4xl uppercase text-crimson font-black tracking-tight">
          CASE NOT FOUND
        </h1>

        <p className="font-mono text-sm text-ink leading-relaxed">
          The requested forensic file or log archive does not exist in this sector. Verify the URL or return to the briefing desk.
        </p>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-block px-6 py-2.5 bg-crimson text-paper border-3 border-ink rounded font-mono text-sm font-bold uppercase tracking-wider shadow-hard hover:-translate-y-0.5 hover:shadow-hard-lg active:translate-y-0.5 active:shadow-none transition-all"
          >
            RETURN TO PORTAL
          </Link>
        </div>
      </Panel>
    </div>
  );
}
