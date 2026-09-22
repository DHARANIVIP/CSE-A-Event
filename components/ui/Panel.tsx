import React from "react";

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  as?: "div" | "section" | "article" | "main";
}

export const Panel: React.FC<PanelProps> = ({
  children,
  className = "",
  id,
  as: Component = "div",
}) => {
  return (
    <Component
      id={id}
      className={`bg-paper border-2 border-ink rounded-sm shadow-hard p-5 sm:p-7 md:p-8 relative ${className}`}
    >
      {children}
    </Component>
  );
};
