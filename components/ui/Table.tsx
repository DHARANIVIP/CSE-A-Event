import React from "react";

interface TableProps {
  headers: React.ReactNode[];
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ headers, children, className = "" }) => {
  return (
    <div className={`overflow-x-auto w-full border-2 border-ink rounded shadow-hard-sm bg-paper ${className}`}>
      <table className="w-full text-left font-mono text-xs sm:text-sm border-collapse">
        <thead className="bg-crimson text-cream border-b-2 border-ink sticky top-0 z-10 select-none">
          <tr>
            {headers.map((h, idx) => (
              <th
                key={idx}
                className="py-3 px-3 sm:px-4 font-black uppercase tracking-wider border-r border-ink/40 last:border-r-0"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/20">{children}</tbody>
      </table>
    </div>
  );
};

export const TableRow: React.FC<{
  children: React.ReactNode;
  isEven?: boolean;
  isHighlighted?: boolean;
  className?: string;
}> = ({ children, isEven = false, isHighlighted = false, className = "" }) => {
  return (
    <tr
      className={`transition-colors ${
        isHighlighted
          ? "bg-gold/30 font-bold hover:bg-gold/40"
          : isEven
          ? "bg-cream/50 hover:bg-cream"
          : "bg-paper hover:bg-cream/30"
      } ${className}`}
    >
      {children}
    </tr>
  );
};

export const TableCell: React.FC<{
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}> = ({ children, className = "", colSpan }) => {
  return (
    <td
      colSpan={colSpan}
      className={`py-3 px-3 sm:px-4 border-r border-ink/20 last:border-r-0 leading-relaxed ${className}`}
    >
      {children}
    </td>
  );
};
