"use client";

import React, { useRef, useEffect } from "react";

interface CodeInputProps {
  value: string; // 5-char string or partial
  onChange: (val: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  onEnterSubmit?: () => void;
}

export const CodeInput: React.FC<CodeInputProps> = ({
  value,
  onChange,
  disabled = false,
  hasError = false,
  onEnterSubmit,
}) => {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const chars = value.padEnd(5, " ").slice(0, 5).split("");

  // Focus first empty box on mount if enabled
  useEffect(() => {
    if (!disabled) {
      const firstEmptyIndex = chars.findIndex((c) => c === " ");
      const targetIdx = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
      inputsRef.current[targetIdx]?.focus();
    }
  }, [disabled]);

  const updateChar = (index: number, newChar: string) => {
    const arr = [...chars];
    arr[index] = newChar;
    const newVal = arr.join("").trimEnd();
    onChange(newVal);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "Backspace") {
      e.preventDefault();
      if (chars[index] !== " ") {
        updateChar(index, " ");
      } else if (index > 0) {
        updateChar(index - 1, " ");
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 4) {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (onEnterSubmit) onEnterSubmit();
    }
  };

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!rawVal) return;

    const char = rawVal.slice(-1);
    updateChar(index, char);

    // Auto-advance to next box
    if (index < 4) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    if (disabled) return;

    const pasteData = e.clipboardData
      .getData("text")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 5);

    if (pasteData) {
      onChange(pasteData);
      const nextFocus = Math.min(pasteData.length, 4);
      inputsRef.current[nextFocus]?.focus();
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 5 Distinct Input Boxes */}
      <div
        className="flex items-center justify-center gap-2 sm:gap-3.5"
        role="group"
        aria-label="5-character secret access code input"
      >
        {[0, 1, 2, 3, 4].map((idx) => {
          const char = chars[idx] === " " ? "" : chars[idx];
          return (
            <input
              key={idx}
              ref={(el) => {
                inputsRef.current[idx] = el;
              }}
              id={`code-box-${idx}`}
              type="text"
              value={char}
              onChange={(e) => handleChange(idx, e)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              disabled={disabled}
              maxLength={2} // Allow quick key override
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              inputMode="text"
              aria-label={`Character ${idx + 1} of 5`}
              className={`w-[52px] h-[60px] sm:w-[64px] sm:h-[72px] bg-cream border-4 rounded-md text-center font-mono font-black text-2xl sm:text-3xl text-ink uppercase shadow-hard transition-all duration-120 select-none focus:outline-none focus:ring-3 focus:ring-crimson focus:ring-offset-2 focus:shadow-hard-lg ${
                hasError ? "border-danger ring-danger animate-shake" : "border-ink"
              } ${disabled ? "opacity-50 cursor-not-allowed border-dashed" : ""}`}
            />
          );
        })}
      </div>

      {/* Screen Reader Live Announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {value.length === 5
          ? `Code entered: ${value.split("").join(" ")}. Ready to submit.`
          : `${value.length} of 5 characters entered.`}
      </div>
    </div>
  );
};
