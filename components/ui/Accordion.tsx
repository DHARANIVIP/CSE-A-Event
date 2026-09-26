"use client";

import React, { useState } from "react";

interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({ items, className = "" }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className={`space-y-3 w-full ${className}`}>
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={item.id}
            className="border-2 border-ink rounded bg-cream/30 overflow-hidden shadow-hard-sm"
          >
            <button
              onClick={() => toggle(idx)}
              className="w-full text-left px-4 py-3.5 bg-cream flex items-center justify-between font-mono font-bold text-sm sm:text-base text-ink uppercase tracking-wide hover:bg-cream/70 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson"
              aria-expanded={isOpen}
            >
              <span>{item.title}</span>
              <span className="font-mono text-base font-black text-crimson ml-2">
                {isOpen ? "−" : "+"}
              </span>
            </button>

            {isOpen && (
              <div className="px-4 py-3.5 bg-paper font-mono text-sm leading-relaxed text-ink border-t-2 border-ink">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
