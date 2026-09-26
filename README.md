# Mystery Box – The Digital Case Event Portal

> *"Solve — I can investigate and solve a technical problem."*

A full-stack, competition-grade forensic case event portal designed for the annual college CSE technical competition **Mystery Box – The Digital Case**. Teams of 3–4 students analyze raw forensic server logs, CSV network dumps, and syslog files to deduce a secret 5-character cryptographic access code, enter it into the interactive **Mystery Box**, and compete for the earliest server-recorded victory timestamp.

Built with **Next.js (App Router, TypeScript Strict)**, **Supabase PostgreSQL**, pure vector SVGs, and procedural Canvas particle simulations. Enforces a strict **Zero-Image Asset** architecture and satisfies **S1–S14 Security Guarantees**.

---

## Key Features & Highlights

- **Zero Image Assets**: 100% vector SVG icons, procedural Canvas terracotta brick wall with CSS fallback, 60fps Canvas rain particle simulation, vector fedora favicon, and code-generated OpenGraph previews.
- **Retro Detective Aesthetic**: Inspired by Murdle — warm cream paper cards, crimson block-letter varsity typography (Graduate), Pacifico signatures, typewriter monospace body (Courier Prime), and cyan hard-offset shadows.
- **Tamper-Proof Constant-Time Security**: Secret access code is stored only as a salted slow `scrypt` hash ($N=32768, r=8, p=1$). Verification uses `crypto.timingSafeEqual` and constant-work execution across all code paths.
- **Authoritative Server Timestamping**: Official rankings are determined strictly by PostgreSQL `clock_timestamp()` via atomic advisory transaction locking (`pg_advisory_xact_lock`).
- **Escalating Cooldown Engine**: Automatic lockout after 3 consecutive wrong attempts (escalating: 30s $\to$ 60s $\to$ 120s $\to$ 240s $\to$ 300s) to prevent automated script brute-forcing.
- **Full Admin Command Suite**: Real-time event timer controls, CSV roster importer with automatic 6-digit PIN generator, printable vector SVG QR passes, hint scheduler, suspicious team indicators (>15 wrong attempts), and a full-screen projector winner reveal mode.
- **Adaptive Canvas Performance**: Frame-time watchdog automatically steps down rain quality presets on low-power devices; full support for `prefers-reduced-motion`.

---

## System Requirements

- **Node.js**: v18.18+ or v20+ / v22+ (tested on Node v24)
- **Package Manager**: npm v9+
- **Database**: PostgreSQL with `pgcrypto` extension enabled (Supabase recommended)

---

## Local Setup & Quick Start

1. **Clone the repository and install dependencies**:
   ```bash
   git clone <repo-url>
   cd "Mystery box"
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

3. **Generate Cryptographic Hashes**:
   - **Secret 5-Character Code Hash**:
     ```bash
     npm run hash:code
     # Prompts for a 5-character alphanumeric code (e.g. K9X2P)
     # Copy CODE_SALT and CODE_HASH into your .env.local
     ```
   - **Admin Password Hash**:
     ```bash
     npm run hash:admin
     # Prompts for admin password (e.g. masterkey123)
     # Copy ADMIN_PASSWORD_HASH into your .env.local
     ```
   - **Session Secret**:
     Generate a secure 64-character random hex string:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```

4. **Start Local Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.
   - Access the devkit design system preview at `http://localhost:3000/devkit`.
   - Access the admin portal at `http://localhost:3000/admin`.

---

## Supabase Database Setup & Migrations

If deploying to Supabase:
1. Create a new Supabase project in the Supabase Dashboard.
2. Navigate to **SQL Editor** and execute the migrations in sequential order:
   - [`supabase/migrations/0001_init.sql`](file:///e:/Mystery%20box/supabase/migrations/0001_init.sql) (Tables, indexes, and constraints)
   - [`supabase/migrations/0002_views_functions.sql`](file:///e:/Mystery%20box/supabase/migrations/0002_views_functions.sql) (Leaderboard view and atomic `record_submission()` function)
   - [`supabase/migrations/0003_rls.sql`](file:///e:/Mystery%20box/supabase/migrations/0003_rls.sql) (Enable Row Level Security and revoke public access)

3. **Case Archive Storage (Mode A vs Mode B)**:
   - **Mode A (Supabase Private Storage)**:
     - Create a **private** bucket named `case-files`.
     - Upload `mystery-case-archive.zip`.
     - Ensure `CASE_OBJECT_PATH=mystery-case-archive.zip` is set in your env.
   - **Mode B (External Download Link)**:
     - Set `CASE_ZIP_EXTERNAL_URL=https://your-drive-link.com/download` in your env.

---

## Team Roster Seeding & Printable Passes

1. Prepare a CSV file (e.g. `teams.csv`):
   ```csv
   team_id,team_name,members,pin
   TEAM-01,Cipher Enigma,Alice;Bob;Charlie,
   TEAM-02,Binary Shadows,David;Eva;Frank,
   ```
   *(Leaving PIN empty will automatically generate a cryptographically random 6-digit numeric PIN)*.

2. Import via Admin Panel (`/admin/teams`) or CLI script:
   ```bash
   npm run seed:teams teams.csv
   ```
3. Open `http://localhost:3000/admin/teams/print` to print physical credential cards with pure vector SVG QR codes.

---

## Running Automated Verification Tests

```bash
# Run all unit tests, API tests, and concurrency race-condition tests
npm run test

# Run bundle security scan to verify zero secrets/hashes leaked in client code (Rule S14)
npm run check:secrets

# Run load test simulating 80 concurrent polling teams
npm run load:test
```

---

## Event-Day Operational Checklist

| Timeline | Action Item |
|---|---|
| **T - 60 min** | Verify Supabase connection; run `npm run check:secrets`; ensure `CASE_OBJECT_PATH` or `CASE_ZIP_EXTERNAL_URL` is set. |
| **T - 30 min** | Distribute physical printed team credential passes with PINs; verify projector display at `/leaderboard`. |
| **T - 10 min** | Log in to `/admin`; verify clock drift indicator is < 200ms; announce portal URL `http://<domain>/enter`. |
| **T - 00 min (Start)** | Click **START NOW** and **RELEASE CASE FILES** in `/admin/event`. Students receive download access. |
| **T + 45 min** | Release scheduled hints via `/admin/hints`. |
| **T + 120 min** | Click **+10 MIN** if students need extra time, or click **END NOW** at official cutoff. |
| **Post-Event** | Navigate to `/admin/winner`, click **RE-VERIFY DATABASE**, copy top 3 summary, and launch **REVEAL WINNER (PROJECTOR)** for the awards ceremony. |

---

## Fallback & Emergency Contingency Plan

- **College Wi-Fi Outage**:
  - Teams can continue analyzing already downloaded case files offline on their local machines.
  - Teams write their derived 5-character access code on their official printed team badge and physically hand it to the lead organizer at the CCF desk. The organizer records the submission via the admin station.
- **Suspected Code Leak**:
  - Immediately generate a new code hash with `npm run hash:code` and update `CODE_SALT` & `CODE_HASH` on Vercel.
  - Rotate `SESSION_SECRET` to invalidate all active tokens.

---

# CSE-A-Event
