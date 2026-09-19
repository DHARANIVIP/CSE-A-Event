"use client";

import React, { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = "",
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on ESC key and trap focus
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className={`bg-paper border-4 border-ink rounded-md shadow-hard-lg max-w-lg w-full max-h-[90vh] flex flex-col relative overflow-hidden ${className}`}
      >
        {/* Header */}
        <div className="bg-cream border-b-3 border-ink px-5 py-3 flex items-center justify-between select-none">
          <h2
            id="modal-title"
            className="font-display text-xl uppercase tracking-tight text-crimson font-black"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center font-mono font-bold text-ink hover:text-crimson hover:bg-paper rounded border-2 border-ink shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto font-mono text-sm leading-relaxed text-ink">
          {children}
        </div>
      </div>
    </div>
  );
};
