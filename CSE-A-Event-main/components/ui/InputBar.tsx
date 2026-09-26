import React from "react";

export interface InputBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const InputBar: React.FC<InputBarProps> = ({
  label,
  error,
  hint,
  id,
  className = "",
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="font-mono text-xs sm:text-sm font-black uppercase text-ink tracking-wider"
        >
          {label}
        </label>
      )}

      <div className="relative w-full">
        <input
          id={inputId}
          className={`w-full bg-cream border-4 border-ink rounded-md px-4 py-3 font-mono text-base text-ink placeholder:text-muted/60 shadow-hard transition-all duration-120 focus:outline-none focus:ring-3 focus:ring-crimson focus:ring-offset-2 focus:shadow-hard-lg ${
            error ? "border-danger ring-danger" : ""
          } ${className}`}
          {...props}
        />
      </div>

      {hint && !error && (
        <span className="font-mono text-xs text-muted leading-tight">{hint}</span>
      )}
      {error && (
        <span className="font-mono text-xs font-bold text-danger leading-tight animate-pulse">
          {error}
        </span>
      )}
    </div>
  );
};
