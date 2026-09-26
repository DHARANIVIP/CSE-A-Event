import React from "react";
import { mockDB } from "@/lib/supabase-server";
import { eventConfig } from "@/config/event.config";
import { generateQRSVGString } from "@/lib/qr-svg";
import { env } from "@/lib/env";
import { PrintButton } from "@/components/ui/PrintButton";

export const dynamic = "force-dynamic";

export default async function PrintTeamCardsPage() {
  const teams = Array.from(mockDB.teams.values()).filter((t) => !t.disabled);
  const portalUrl = `${env.SITE_ORIGIN}/enter`;

  return (
    <div className="min-h-screen bg-white text-black p-4 print:p-0">
      {/* Top action bar (hidden during print) */}
      <div className="no-print max-w-4xl mx-auto mb-6 p-4 bg-cream border-2 border-ink rounded shadow-hard-sm flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl uppercase text-crimson font-black">
            OFFICIAL TEAM ACCESS PASSES (PRINT READY)
          </h1>
          <p className="font-mono text-xs text-muted">
            Each card contains team credentials and a vector QR code directing to the entry portal.
          </p>
        </div>

        <PrintButton
          className="px-5 py-2.5 bg-crimson text-paper border-2 border-ink rounded font-mono text-xs font-black uppercase shadow-hard hover:shadow-hard-lg"
        >
          PRINT ALL PASSES
        </PrintButton>
      </div>

      {/* Grid of Team Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto print:grid-cols-2 print:gap-4">
        {teams.map((team) => {
          const qrSvg = generateQRSVGString(portalUrl, {
            size: 130,
            fgColor: "#0B0B0B",
            bgColor: "#FFFFFF",
          });

          return (
            <div
              key={team.id}
              className="p-5 border-3 border-black rounded-lg bg-[#FBFAF7] flex flex-col justify-between space-y-4 print:break-inside-avoid shadow-sm"
            >
              {/* Card Header */}
              <div className="border-b-2 border-black pb-2 flex items-center justify-between">
                <div>
                  <span className="font-mono text-[10px] font-black uppercase text-[#B30033] tracking-widest block">
                    {eventConfig.collegeName}
                  </span>
                  <h2 className="font-display text-xl font-black uppercase text-black">
                    {eventConfig.eventName}
                  </h2>
                </div>
                <span className="px-2 py-0.5 bg-[#B30033] text-white font-mono text-xs font-bold rounded">
                  PASS
                </span>
              </div>

              {/* Card Content & QR Code */}
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-2 font-mono">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-600 block">
                      TEAM IDENTIFIER
                    </span>
                    <span className="text-xl font-black text-black block">{team.id}</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-600 block">
                      TEAM NAME
                    </span>
                    <span className="text-sm font-bold text-black block leading-tight">
                      {team.name}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-600 block">
                      ASSIGNED 6-DIGIT PIN
                    </span>
                    <span className="text-sm font-mono font-bold bg-[#FFF4E0] px-2 py-0.5 border border-black rounded inline-block">
                      {team.pin_hash.split(":")[0] ? "••••••" : "SEE LIST"}
                    </span>
                  </div>
                </div>

                {/* Pure In-Repo Vector SVG QR Code */}
                <div className="p-2 bg-white border-2 border-black rounded flex-shrink-0">
                  <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-2 border-t border-gray-300 font-mono text-[10px] text-gray-700 flex justify-between items-center">
                <span>PORTAL: {portalUrl}</span>
                <span className="font-bold">INSPECTOR STATION PASS</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
