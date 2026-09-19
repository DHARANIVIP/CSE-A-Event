import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className = "",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-mono font-bold uppercase tracking-wider select-none transition-all duration-120 border-3 border-ink rounded focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-crimson";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base tracking-widest",
  };

  const variantStyles = {
    primary:
      "bg-crimson text-paper shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg hover:bg-crimson-dark active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
    secondary:
      "bg-cream text-crimson shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
    danger:
      "bg-danger text-paper shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
  };

  const disabledStyles =
    "opacity-50 cursor-not-allowed border-dashed hover:translate-x-0 hover:translate-y-0 hover:shadow-hard active:translate-x-0 active:translate-y-0 pointer-events-none";

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
        disabled || isLoading ? disabledStyles : ""
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>PROCESSING...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
