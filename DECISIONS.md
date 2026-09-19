# Architectural Decisions Log (`DECISIONS.md`)

This document records all architectural, design, and engineering decisions made during the development of **Mystery Box – The Digital Case Event Portal**, in compliance with Operating Rule 1 and Rule 6.

---

### Decision 1: Case Archive Delivery Strategy (Section 9.3)
- **Decision**: Implemented dual-mode delivery in `app/api/case-download/route.ts`. If `CASE_ZIP_EXTERNAL_URL` is set, it redirects to the verified external URL; if not, it generates a 60-second signed download URL via Supabase Storage private bucket (`case-files`).
- **Rationale**: Provides maximum operational flexibility for college Wi-Fi environments (supporting OneDrive, Google Drive, or Supabase Storage without client-side reconfiguration).

### Decision 2: Zero Image Asset Mandate (Section 2)
- **Decision**: Zero image files (`.png`, `.jpg`, `.ico`, `.webp`, `.gif`) exist anywhere in `public/` or source code.
- **Implementation**: Favicon is served via pure vector SVG (`app/icon.svg`), OpenGraph share preview is dynamically rendered with `@vercel/og` (`app/opengraph-image.tsx`), background bricks are rendered via HTML5 Canvas with pure CSS linear-gradient fallbacks, rain particle simulation is rendered via interactive HTML5 Canvas, and all UI icons are inline React SVG components.

### Decision 3: Audio Effects Synthesis via Web Audio API (Section 12)
- **Decision**: All sound effects (chest wooden creak, lock click, victory chime) are dynamically synthesized using the browser's native `AudioContext` with oscillators and noise buffers.
- **Rationale**: 100% compliant with zero external media files rule, zero bandwidth overhead, zero asset 404 risk. Accessible sound toggle persists muted state.

### Decision 4: In-Repo Zero-Dependency SVG QR Code Generator (Section 11.3)
- **Decision**: Implemented `lib/qr-svg.ts` as a pure TypeScript QR Code matrix generator rendering clean vector SVGs for printable team credential cards.
- **Rationale**: Avoids external binary packages, Canvas dependencies, or external API calls, ensuring high-fidelity printing even offline.

### Decision 5: Safe Zero-Dependency Markdown Renderer (Section 8.3)
- **Decision**: Created `lib/markdown.ts`, a safe, lightweight parser rendering sanitized JSX for headings, bold/italic, blockquotes, lists, tables, and code snippets.
- **Rationale**: Eliminates dependencies on heavyweight external parsers, prevents raw HTML XSS injection, and perfectly integrates into the Murdle detective paper typography.

### Decision 6: Testing Strategy & Database Mocking for Deterministic CI (Section 17)
- **Decision**: Vitest test suites utilize an in-memory transactional mock adhering to the Supabase Postgres contract, enabling 100% offline verification of atomic locking, scrypt hashing, rate limiting, and session security.
- **Rationale**: Enables developers and CI pipelines to execute all unit, concurrency, and security scans without requiring a live remote Supabase project connection.

### Decision 7: Session Token Separation (Section 3 S7)
- **Decision**: Dedicated cookie names (`mb_team_token` and `mb_admin_token`) with distinct JWT audiences (`mystery-team` and `mystery-admin`) and independent expiration TTLs (8 hours for teams, 4 hours for admins).
- **Rationale**: Prevents privilege escalation and credential re-use between participants and event organizers.
