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
      <defs>
        <linearGradient id="cowboyFelt" x1="32" y1="9" x2="32" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2E231B" />
          <stop offset="50%" stopColor="#1C1511" />
          <stop offset="100%" stopColor="#140E0A" />
        </linearGradient>
        <linearGradient id="brimShading" x1="2" y1="31" x2="62" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#17110C" />
          <stop offset="50%" stopColor="#2A1F17" />
          <stop offset="100%" stopColor="#140E0A" />
        </linearGradient>
      </defs>

      {/* 1. Curled Western Cowboy Brim (Cattleman silhouette) */}
      <path
        d="M2 33.5 C4 27.5, 15 29.5, 32 29.5 C49 29.5, 60 27.5, 62 33.5 C62 39.5, 48 43, 32 43 C16 43, 2 39.5, 2 33.5 Z"
        fill="url(#brimShading)"
        stroke="#0F0A07"
        strokeWidth="1.2"
      />

      {/* 2. Indented Cattleman Crown */}
      <path
        d="M16 30 C15 19, 19 9.5, 27 8.5 C29.5 11, 34.5 11, 37 8.5 C45 9.5, 49 19, 48 30 Z"
        fill="url(#cowboyFelt)"
        stroke="#0F0A07"
        strokeWidth="1.2"
      />

      {/* Crown Center Crease Shadow */}
      <path
        d="M32 9.5 C30 14, 30 22, 32 27"
        stroke="#0D0907"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* 3. Saddle Leather Hatband */}
      <path
        d="M16 29.5 C21 30.8, 43 30.8, 48 29.5 L47.4 25.5 C43 26.8, 21 26.8, 16.6 25.5 Z"
        fill="#54331D"
        stroke="#2E1B0D"
        strokeWidth="0.8"
      />

      {/* 4. Antique Brass 5-Point Marshal Star Concho */}
      <polygon
        points="32,25.5 32.8,27.2 34.6,27.3 33.2,28.4 33.7,30.1 32,29.1 30.3,30.1 30.8,28.4 29.4,27.3 31.2,27.2"
        fill="#C49A3E"
        stroke="#7A5A1A"
        strokeWidth="0.5"
      />
    </svg>
  );
};
