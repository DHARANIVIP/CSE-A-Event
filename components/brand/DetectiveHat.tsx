import React from "react";

interface DetectiveHatProps {
  className?: string;
  size?: number;
}

export const DetectiveHat: React.FC<DetectiveHatProps> = ({
  className = "",
  size = 48,
}) => {
  return (
    <svg
      width={size}
      height={(size * 3) / 4}
      viewBox="0 0 64 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Hat Brim */}
      <path
        d="M4 36 C4 32, 16 30, 32 30 C48 30, 60 32, 60 36 C60 40, 48 42, 32 42 C16 42, 4 40, 4 36 Z"
        fill="#0B0B0B"
      />
      {/* Hat Crown with indented crease */}
      <path
        d="M16 30 C15 20, 18 10, 27 9 C30 11, 34 11, 37 9 C46 10, 49 20, 48 30 Z"
        fill="#0B0B0B"
      />
      {/* Fedora Ribbon */}
      <path
        d="M16 28 C20 29, 44 29, 48 28 L47.5 24 C44 25, 20 25, 16.5 24 Z"
        fill="#B30033"
      />
      {/* Brass Buckle Pin */}
      <rect x="29" y="23" width="6" height="5" rx="1" fill="#E0A526" />
      <rect x="30.5" y="24" width="3" height="3" fill="#0B0B0B" />
    </svg>
  );
};
