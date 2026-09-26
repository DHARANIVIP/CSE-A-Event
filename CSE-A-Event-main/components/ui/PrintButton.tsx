"use client";

import React from "react";

interface PrintButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function PrintButton({
  className = "px-3 py-1.5 bg-cream text-ink border-2 border-ink rounded font-mono text-xs font-bold uppercase shadow-hard-sm hover:shadow-hard active:translate-y-0.5",
  children = "PRINT VERSION",
}: PrintButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined") {
          window.print();
        }
      }}
      className={className}
    >
      {children}
    </button>
  );
}
