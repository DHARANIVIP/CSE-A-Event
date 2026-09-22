// Central Event Configuration
// All event-specific labels, limits, timings, and flags are defined here.
// No hardcoded strings in UI components.

export interface EventConfig {
  eventName: string;
  subtitle: string;
  organizerTeam: string;
  collegeName: string;
  philosophyTagline: string;
  inspectorName: string;
  inspectorQuote: string;
  year: number;
  expectedDuration: string;
  audience: string;
  rateLimit: {
    teamSubmissionsPerMinute: number;
    ipSubmissionsPerMinute: number;
    consecutiveWrongThreshold: number;
    cooldownSchedule: number[]; // seconds: [30, 60, 120, 240, 300]
    cooldownResetInactivityMinutes: number;
    loginMaxAttempts: number;
    loginWindowMinutes: number;
    caseDownloadsPerHour: number;
  };
  features: {
    checkpointsEnabled: boolean;
    soundEffectsEnabled: boolean;
    spectatorModeEnabled: boolean;
    showFirstSolverGlobalAlert: boolean;
  };
  checkpoints: Array<{
    id: string;
    stage: number;
    title: string;
    description: string;
  }>;
}

export const eventConfig: EventConfig = {
  eventName: process.env.NEXT_PUBLIC_EVENT_NAME || "DETECTRIX",
  subtitle: "Investigate. Connect. Decode. Unlock.",
  organizerTeam: process.env.NEXT_PUBLIC_TEAM_NAME || "The Code Guild & Forensics Lab",
  collegeName: process.env.NEXT_PUBLIC_COLLEGE_NAME || "Department of Computer Science & Engineering",
  philosophyTagline: "Investigate. Connect. Decode. Unlock.",
  inspectorName: "Inspector Irratino",
  inspectorQuote: "Examine the printed log files, connect related records, and solve the 10 questions to unlock the access code.",
  year: 2026,
  expectedDuration: "2h 30m (10:00 AM – 12:30 PM IST)",
  audience: "Second-Year CSE Students (4 Members per Team)",
  rateLimit: {
    teamSubmissionsPerMinute: 5,
    ipSubmissionsPerMinute: 30,
    consecutiveWrongThreshold: 3,
    cooldownSchedule: [30, 60, 120, 240, 300],
    cooldownResetInactivityMinutes: 10,
    loginMaxAttempts: 5,
    loginWindowMinutes: 5,
    caseDownloadsPerHour: 10,
  },
  features: {
    checkpointsEnabled: true,
    soundEffectsEnabled: true,
    spectatorModeEnabled: true,
    showFirstSolverGlobalAlert: false,
  },
  checkpoints: [
    { id: "stage1", stage: 1, title: "Stage 1: Rogue Terminal Found", description: "Identified anomalous MAC address from firewall drops." },
    { id: "stage2", stage: 2, title: "Stage 2: Host IP Pinpointed", description: "Traced host device mapping in DHCP leases." },
    { id: "stage3", stage: 3, title: "Stage 3: Badge Reader Discrepancy", description: "Isolated anomalous physical room access badge." },
    { id: "stage4", stage: 4, title: "Stage 4: Staged Payload Identified", description: "Discovered payload directory and script name." },
    { id: "stage5", stage: 5, title: "Stage 5: Final Checksum Derived", description: "Calculated network packet signature check digit." },
  ],
};
