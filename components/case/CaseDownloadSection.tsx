"use client";

import React, { useState } from "react";
import { Button } from "../ui/Button";

interface CaseDownloadSectionProps {
  caseReleased: boolean;
  caseSha256: string | null;
}

export const CaseDownloadSection: React.FC<CaseDownloadSectionProps> = ({
  caseReleased,
  caseSha256,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCopySha = () => {
    if (!caseSha256) return;
    navigator.clipboard.writeText(caseSha256);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    setDownloading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/case-download");
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error?.message || "Failed to download case archive.");
        setDownloading(false);
        return;
      }

      if (data.downloadUrl) {
        window.open(data.downloadUrl, "_blank");
      }
    } catch {
      setErrorMsg("Network failure requesting download link.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-cream border-2 border-ink rounded shadow-hard-sm">
        <div className="space-y-1">
          <div className="font-mono text-xs font-bold text-muted uppercase">
            ARCHIVE FORMAT: ZIP (FORENSIC DUMPS, CSV, LOGS)
          </div>
          <div className="font-mono text-sm font-black text-ink">
            mystery-case-archive.zip
          </div>
        </div>

        {caseReleased ? (
          <Button
            variant="primary"
            size="md"
            onClick={handleDownload}
            isLoading={downloading}
          >
            DOWNLOAD CASE ARCHIVE (ZIP)
          </Button>
        ) : (
          <Button variant="secondary" size="md" disabled>
            LOCKED — CASE NOT RELEASED YET
          </Button>
        )}
      </div>

      {caseSha256 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-paper border border-ink/30 rounded font-mono text-xs">
          <div className="truncate">
            <span className="font-bold text-muted mr-2">SHA-256 INTEGRITY:</span>
            <code className="text-crimson font-mono select-all">{caseSha256}</code>
          </div>
          <button
            onClick={handleCopySha}
            className="self-start sm:self-auto px-2 py-1 bg-cream border border-ink rounded font-bold uppercase text-[10px] text-ink hover:text-crimson shadow-hard-sm"
          >
            {copied ? "COPIED!" : "COPY SHA-256"}
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-danger/10 border-2 border-danger rounded text-danger font-mono text-xs font-bold">
          {errorMsg}
        </div>
      )}
    </div>
  );
};
