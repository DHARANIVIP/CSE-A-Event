import React from "react";

export const SkipLink: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-crimson focus:text-paper focus:border-3 focus:border-ink focus:shadow-hard font-mono text-sm font-bold uppercase tracking-wider"
    >
      Skip to content
    </a>
  );
};
