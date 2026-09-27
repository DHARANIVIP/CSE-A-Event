"use client";

import React, { useRef, useEffect } from "react";

interface CodeInputProps {
  value: string; // 10-char string or partial
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
  const chars = value.padEnd(10, " ").slice(0, 10).split("");

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
    } else if (e.key === "ArrowRight" && index < 9) {
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
    if (index < 9) {
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
      .slice(0, 10);

    if (pasteData) {
      onChange(pasteData);
      const nextFocus = Math.min(pasteData.length, 9);
      inputsRef.current[nextFocus]?.focus();
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* 10 Discrete Input Boxes (split into two groups of 5 with an atmospheric hyphen) */}
      <div
        className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 max-w-full"
        role="group"
        aria-label="10-character secret access code input"
      >
        {/* First Half: Boxes 0 - 4 */}
        <div className="flex items-center gap-1 sm:gap-1.5">
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
                maxLength={2}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                inputMode="text"
                aria-label={`Character ${idx + 1} of 10`}
                className={`w-[30px] h-[44px] sm:w-[46px] sm:h-[58px] md:w-[52px] md:h-[64px] bg-cream border-2 sm:border-3 rounded-sm text-center font-mono font-black text-lg sm:text-2xl md:text-3xl text-ink uppercase shadow-hard transition-all duration-120 select-none focus:outline-none focus:ring-2 focus:ring-brass focus:ring-offset-1 focus:shadow-hard-lg ${
                  hasError ? "border-danger ring-danger animate-shake" : "border-ink"
                } ${disabled ? "opacity-50 cursor-not-allowed border-dashed" : ""}`}
              />
            );
          })}
        </div>

        {/* Center Divider Dot / Dash */}
        <span className="font-mono font-black text-crimson text-sm sm:text-lg select-none px-0.5">
          —
        </span>

        {/* Second Half: Boxes 5 - 9 */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {[5, 6, 7, 8, 9].map((idx) => {
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
                maxLength={2}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                inputMode="text"
                aria-label={`Character ${idx + 1} of 10`}
                className={`w-[30px] h-[44px] sm:w-[46px] sm:h-[58px] md:w-[52px] md:h-[64px] bg-cream border-2 sm:border-3 rounded-sm text-center font-mono font-black text-lg sm:text-2xl md:text-3xl text-ink uppercase shadow-hard transition-all duration-120 select-none focus:outline-none focus:ring-2 focus:ring-brass focus:ring-offset-1 focus:shadow-hard-lg ${
                  hasError ? "border-danger ring-danger animate-shake" : "border-ink"
                } ${disabled ? "opacity-50 cursor-not-allowed border-dashed" : ""}`}
              />
            );
          })}
        </div>
      </div>

      {/* Screen Reader Live Announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {value.length === 10
          ? `Code entered: ${value.split("").join(" ")}. Ready to submit.`
          : `${value.length} of 10 characters entered.`}
      </div>
    </div>
  );
};
