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
      className={`group relative flex flex-col items-center justify-center bg-cream border-2 border-ink rounded transition-all duration-120 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-crimson ${
        isWide
          ? "w-[218px] sm:w-[226px] h-[92px] sm:h-[104px] px-4"
          : "w-[92px] sm:w-[104px] h-[92px] sm:h-[104px]"
      } shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ${className}`}
    >
      {badge && (
        <span className="absolute -top-2.5 -right-2 px-1.5 py-0.5 bg-crimson text-paper font-mono text-[10px] font-bold rounded border border-ink shadow-sm uppercase tracking-wider">
          {badge}
        </span>
      )}

      <div className="transform group-hover:scale-105 transition-transform duration-120 flex items-center justify-center">
        {icon}
      </div>

      <span className="mt-1 font-mono text-[11px] sm:text-[12px] md:text-[13px] font-black uppercase text-crimson tracking-wider text-center leading-tight truncate max-w-full px-1">
        {label}
      </span>
    </Link>
  );
};
