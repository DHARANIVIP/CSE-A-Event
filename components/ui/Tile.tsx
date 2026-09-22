import React from "react";
import Link from "next/link";

interface TileProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  isWide?: boolean;
  badge?: string;
  className?: string;
  id?: string;
}

export const Tile: React.FC<TileProps> = ({
  href,
  label,
  icon,
  isWide = false,
  badge,
  className = "",
  id,
}) => {
  return (
    <Link
      id={id}
      href={href}
      className={`group relative flex flex-col items-center justify-center bg-cream border-2 border-ink rounded-sm transition-all duration-120 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass ${
        isWide
          ? "w-[240px] sm:w-[280px] h-[100px] sm:h-[116px] px-4"
          : "w-[124px] sm:w-[140px] h-[100px] sm:h-[116px] px-2"
      } shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${className}`}
    >
      {badge && (
        <span className="absolute -top-2.5 -right-2 px-1.5 py-0.5 bg-crimson text-paper font-mono text-[10px] font-bold rounded-sm border border-ink shadow-sm uppercase tracking-wider">
          {badge}
        </span>
      )}

      <div className="transform group-hover:scale-105 transition-transform duration-120 flex items-center justify-center text-ink group-hover:text-crimson">
        {icon}
      </div>

      <span className="mt-2 font-mono text-[11px] sm:text-xs font-bold uppercase text-ink group-hover:text-crimson tracking-wider text-center leading-tight whitespace-nowrap max-w-full px-1">
        {label}
      </span>
    </Link>
  );
};
