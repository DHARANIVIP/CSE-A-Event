import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "crimson" | "gold" | "success" | "muted" | "cream";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "crimson",
  className = "",
}) => {
  const styles = {
    crimson: "bg-crimson text-paper border-ink",
    gold: "bg-gold text-ink border-ink",
    success: "bg-success text-paper border-ink",
    muted: "bg-muted/20 text-muted border-muted",
    cream: "bg-cream text-crimson border-ink",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-black uppercase tracking-wider border ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
