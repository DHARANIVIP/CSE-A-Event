"use client";

import React from "react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  text: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  if (!toast) return null;

  const typeStyles = {
    success: "bg-paper text-success border-success",
    error: "bg-paper text-danger border-danger",
    info: "bg-cream text-ink border-ink",
  };

  return (
    <aside
      aria-label="Notification"
      className="fixed bottom-5 right-5 z-50 max-w-sm w-full transition-all animate-bounce"
      style={{ animationDuration: "2s", animationIterationCount: 1 }}
    >
      <div
        className={`p-4 border-3 rounded shadow-hard flex items-start justify-between gap-3 font-mono text-sm font-bold ${
          typeStyles[toast.type]
        }`}
      >
        <span className="leading-snug">{toast.text}</span>
        <button
          onClick={onDismiss}
          className="text-xs uppercase font-mono font-black border border-current px-1.5 py-0.5 rounded hover:opacity-80"
          aria-label="Dismiss notification"
        >
          OK
        </button>
      </div>
    </aside>
  );
};
