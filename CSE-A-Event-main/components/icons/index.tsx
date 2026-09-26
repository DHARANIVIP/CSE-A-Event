import React from "react";

export interface IconProps {
  size?: number;
  className?: string;
  color?: string;
}

// 1. CaseFolder Icon
export const CaseFolder: React.FC<IconProps> = ({ size = 48, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <path d="M6 12C6 10.34 7.34 9 9 9H19L23 13H39C40.66 13 42 14.34 42 16V37C42 38.66 40.66 40 39 40H9C7.34 40 6 38.66 6 37V12Z" fill="#E0A526" stroke="#0B0B0B" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M6 18H42V37C42 38.66 40.66 40 39 40H9C7.34 40 6 38.66 6 37V18Z" fill="#FFF4E0" stroke="#0B0B0B" strokeWidth="2.5" />
    <line x1="12" y1="24" x2="30" y2="24" stroke="#B30033" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="12" y1="30" x2="24" y2="30" stroke="#0B0B0B" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 2. Rulebook Icon
export const Rulebook: React.FC<IconProps> = ({ size = 48, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect x="10" y="8" width="28" height="34" rx="3" fill="#B30033" stroke="#0B0B0B" strokeWidth="2.5" />
    <rect x="14" y="8" width="24" height="34" rx="2" fill="#FBFAF7" stroke="#0B0B0B" strokeWidth="2.5" />
    <path d="M18 16H32M18 22H32M18 28H28" stroke="#0B0B0B" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="14" r="1.5" fill="#E0A526" />
    <circle cx="12" cy="24" r="1.5" fill="#E0A526" />
    <circle cx="12" cy="34" r="1.5" fill="#E0A526" />
  </svg>
);

// 3. CrystalBall / Hints Icon
export const CrystalBall: React.FC<IconProps> = ({ size = 48, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <ellipse cx="24" cy="40" rx="14" ry="4" fill="#0B0B0B" />
    <path d="M16 38L18 30H30L32 38H16Z" fill="#E0A526" stroke="#0B0B0B" strokeWidth="2.5" />
    <circle cx="24" cy="20" r="15" fill="#1EB0D8" stroke="#0B0B0B" strokeWidth="2.5" />
    <circle cx="24" cy="20" r="12" fill="#FFF4E0" fillOpacity="0.3" />
    <path d="M19 14C21 11 26 11 28 14" stroke="#FBFAF7" strokeWidth="2.5" strokeLinecap="round" />
    <polygon points="24,15 26,19 30,20 26,22 25,26 23,22 19,20 23,19" fill="#FBFAF7" />
  </svg>
);

// 4. ChestIcon
export const ChestIcon: React.FC<IconProps> = ({ size = 48, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect x="6" y="20" width="36" height="20" rx="2" fill="#8A0027" stroke="#0B0B0B" strokeWidth="2.5" />
    <path d="M6 20C6 14 14 10 24 10C34 10 42 14 42 20H6Z" fill="#B30033" stroke="#0B0B0B" strokeWidth="2.5" />
    <rect x="21" y="18" width="6" height="8" rx="1.5" fill="#E0A526" stroke="#0B0B0B" strokeWidth="2" />
    <circle cx="24" cy="22" r="1.5" fill="#0B0B0B" />
    <line x1="12" y1="10" x2="12" y2="40" stroke="#E0A526" strokeWidth="2" />
    <line x1="36" y1="10" x2="36" y2="40" stroke="#E0A526" strokeWidth="2" />
  </svg>
);

// 5. Trophy / Leaderboard Icon
export const Trophy: React.FC<IconProps> = ({ size = 48, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <path d="M14 9H34V22C34 27.5 29.5 32 24 32C18.5 32 14 27.5 14 22V9Z" fill="#E0A526" stroke="#0B0B0B" strokeWidth="2.5" />
    <path d="M14 13H8C6.9 13 6 13.9 6 15V18C6 22 9.5 24.5 14 25" stroke="#0B0B0B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M34 13H40C41.1 13 42 13.9 42 15V18C42 22 38.5 24.5 34 25" stroke="#0B0B0B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M21 32V38H27V32" stroke="#0B0B0B" strokeWidth="2.5" />
    <rect x="15" y="38" width="18" height="5" rx="1.5" fill="#B30033" stroke="#0B0B0B" strokeWidth="2.5" />
    <polygon points="24,14 25.5,18 29.5,18.5 26.5,21.5 27.5,25.5 24,23.5 20.5,25.5 21.5,21.5 18.5,18.5 22.5,18" fill="#FFF4E0" />
  </svg>
);

// 6. BadgeIcon / About Icon
export const BadgeIcon: React.FC<IconProps> = ({ size = 48, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <polygon points="24,6 29,16 40,16 31,23 35,34 24,28 13,34 17,23 8,16 19,16" fill="#1EB0D8" stroke="#0B0B0B" strokeWidth="2.5" strokeLinejoin="round" />
    <circle cx="24" cy="20" r="4" fill="#E0A526" stroke="#0B0B0B" strokeWidth="2" />
  </svg>
);

// 7. Wrench / Help Icon
export const Wrench: React.FC<IconProps> = ({ size = 48, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <path d="M38 10C35.5 7.5 31.8 7.2 29 9L23 15L27 19L33 13C34.8 15.8 34.5 19.5 32 22L12 42L6 36L26 16C28.5 13.5 32.2 13.2 35 15L38 10Z" fill="#FFF4E0" stroke="#0B0B0B" strokeWidth="2.5" strokeLinejoin="round" />
    <circle cx="10" cy="38" r="2.5" fill="#B30033" />
  </svg>
);

// 8. Padlock Icon
export const Padlock: React.FC<IconProps> = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="4" y="10" width="16" height="12" rx="2" fill="#E0A526" stroke="#0B0B0B" strokeWidth="2" />
    <path d="M8 10V7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7V10" stroke="#0B0B0B" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="15" r="1.5" fill="#0B0B0B" />
    <path d="M12 16.5V18.5" stroke="#0B0B0B" strokeWidth="2" />
  </svg>
);

// 9. Magnifier Icon
export const Magnifier: React.FC<IconProps> = ({ size = 48, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <circle cx="20" cy="20" r="12" fill="#FFF4E0" stroke="#0B0B0B" strokeWidth="3" />
    <path d="M29 29L40 40" stroke="#B30033" strokeWidth="4" strokeLinecap="round" />
    <path d="M15 15C16.5 13 19 12 21.5 12" stroke="#1EB0D8" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// 10. Fingerprint Icon
export const Fingerprint: React.FC<IconProps> = ({ size = 48, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <path d="M24 10C17 10 12 15 12 22C12 31 16 36 17 38" stroke="#B30033" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M17 18C19 15 21 14 24 14C27 14 29 15 31 18C33 21 34 26 33 34" stroke="#0B0B0B" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M21 23C21 21.5 22.3 20 24 20C25.7 20 27 21.5 27 23C27 28 26 32 25 36" stroke="#1EB0D8" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// 11. RainIcon
export const RainIcon: React.FC<IconProps> = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M17.5 12A4.5 4.5 0 0 0 9.2 10.1A5.5 5.5 0 0 0 4 15.5A4.5 4.5 0 0 0 8.5 20H17.5A4.5 4.5 0 0 0 17.5 12Z" fill="#1EB0D8" stroke="#0B0B0B" strokeWidth="1.5" />
    <line x1="8" y1="21" x2="6.5" y2="24" stroke="#1EB0D8" strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="21" x2="10.5" y2="24" stroke="#1EB0D8" strokeWidth="2" strokeLinecap="round" />
    <line x1="16" y1="21" x2="14.5" y2="24" stroke="#1EB0D8" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 12. BrightnessIcon
export const BrightnessIcon: React.FC<IconProps> = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="4" fill="#E0A526" stroke="#0B0B0B" strokeWidth="1.5" />
    <path d="M12 2V4M12 20V22M4 12H2M22 12H20M5 5L6.5 6.5M17.5 17.5L19 19M5 19L6.5 17.5M17.5 6.5L19 5" stroke="#0B0B0B" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// 13. SoundIcon
export const SoundIcon: React.FC<IconProps & { muted?: boolean }> = ({ size = 20, className = "", muted = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M11 5L6 9H2V15H6L11 19V5Z" fill="#FFF4E0" stroke="#0B0B0B" strokeWidth="1.8" strokeLinejoin="round" />
    {!muted ? (
      <>
        <path d="M15.5 8.5C16.8 9.8 17.5 11.5 17.5 13.3" stroke="#B30033" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M19 6C20.9 7.9 22 10.5 22 13.3" stroke="#B30033" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ) : (
      <line x1="16" y1="9" x2="22" y2="15" stroke="#B30033" strokeWidth="2" strokeLinecap="round" />
    )}
  </svg>
);

// 14. LogoutIcon
export const LogoutIcon: React.FC<IconProps> = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M9 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
