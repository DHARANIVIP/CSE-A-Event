"use client";

import React, { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { TeamBadge } from "@/components/brand/TeamBadge";
import { Tile } from "@/components/ui/Tile";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { InputBar } from "@/components/ui/InputBar";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { Table, TableRow, TableCell } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import {
  CaseFolder,
  Rulebook,
  CrystalBall,
  ChestIcon,
  Trophy,
  BadgeIcon,
  Wrench,
  Padlock,
  Magnifier,
  Fingerprint,
} from "@/components/icons";

export default function DevKitPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  return (
    <div className="min-h-screen py-10 px-4 max-w-5xl mx-auto space-y-10">
      <Panel>
        <h1 className="font-display text-3xl uppercase text-crimson font-black mb-2">
          Design System & Component Showcase (DevKit)
        </h1>
        <p className="font-mono text-sm text-muted">
          Used to verify WCAG AA contrast, tokens, interactive states, and typography.
        </p>
      </Panel>

      {/* Brand Lockups */}
      <Panel>
        <h2 className="font-display text-xl uppercase text-crimson mb-4">1. Brand Lockup</h2>
        <div className="py-6 flex flex-col items-center justify-center bg-paper border-2 border-dashed border-ink/30 rounded">
          <Logo />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <Logo isCompact />
          <TeamBadge teamId="TEAM-01" teamName="Binary Shadows" />
          <TeamBadge />
        </div>
      </Panel>

      {/* Tiles */}
      <Panel>
        <h2 className="font-display text-xl uppercase text-crimson mb-4">2. Interactive Tiles</h2>
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <Tile href="#" label="CASE FILES" icon={<CaseFolder />} />
          <Tile href="#" label="RULES" icon={<Rulebook />} />
          <Tile href="#" label="HINTS" icon={<CrystalBall />} badge="NEW" />
          <Tile href="#" label="MYSTERY BOX" icon={<ChestIcon />} />
          <Tile href="#" label="LEADERBOARD" icon={<Trophy />} />
          <Tile href="#" label="ABOUT" icon={<BadgeIcon />} />
          <Tile href="#" label="HELP" icon={<Wrench />} />
          <Tile href="#" label="MY TEAM" icon={<Fingerprint />} isWide />
        </div>
      </Panel>

      {/* Buttons */}
      <Panel>
        <h2 className="font-display text-xl uppercase text-crimson mb-4">3. Buttons & Variants</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button variant="primary">TRY THE CODE</Button>
          <Button variant="secondary">VIEW RULES</Button>
          <Button variant="danger">DISQUALIFY</Button>
          <Button disabled>LOCKED CASE</Button>
          <Button isLoading>SUBMITTING</Button>
          <Button size="sm">SMALL BTN</Button>
          <Button size="lg">LARGE ACTION</Button>
          <Button onClick={() => setModalOpen(true)}>OPEN MODAL</Button>
        </div>
      </Panel>

      {/* Status Banner */}
      <Panel>
        <h2 className="font-display text-xl uppercase text-crimson mb-4">4. Status Banners</h2>
        <StatusBanner status="not_started" remainingSeconds={0} secondsUntilStart={2472} />
        <StatusBanner status="live" remainingSeconds={8049} secondsUntilStart={0} />
        <StatusBanner status="paused" remainingSeconds={0} secondsUntilStart={0} />
        <StatusBanner status="ended" remainingSeconds={0} secondsUntilStart={0} />
      </Panel>

      {/* Input Bar */}
      <Panel>
        <h2 className="font-display text-xl uppercase text-crimson mb-4">5. Input Bar</h2>
        <div className="max-w-md space-y-4">
          <InputBar
            label="TEAM IDENTIFIER"
            placeholder="e.g. TEAM-01"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            hint="Assigned on your printed badge"
          />
          <InputBar
            label="INPUT WITH ERROR"
            placeholder="6-Digit PIN"
            error="INVALID CREDENTIALS"
          />
        </div>
      </Panel>

      {/* Table */}
      <Panel>
        <h2 className="font-display text-xl uppercase text-crimson mb-4">6. Retro Detective Table</h2>
        <Table headers={["RANK", "TEAM", "SOLVED AT", "ATTEMPTS"]}>
          <TableRow isHighlighted>
            <TableCell>
              <Badge variant="gold">#1 FIRST</Badge>
            </TableCell>
            <TableCell>Team Cipher Enigma</TableCell>
            <TableCell>10:44:12.380 IST</TableCell>
            <TableCell>2</TableCell>
          </TableRow>
          <TableRow isEven>
            <TableCell>#2</TableCell>
            <TableCell>Binary Shadows</TableCell>
            <TableCell>11:02:40.112 IST</TableCell>
            <TableCell>4</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>--</TableCell>
            <TableCell className="text-muted">Ghost Protocol</TableCell>
            <TableCell className="text-muted">Unsolved</TableCell>
            <TableCell>9</TableCell>
          </TableRow>
        </Table>
      </Panel>

      {/* Modal Showcase */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Case File Verification">
        <p className="mb-4">
          All case logs are hashed using SHA-256 to ensure forensic chain of custody.
        </p>
        <div className="bg-cream p-3 border-2 border-ink rounded font-mono text-xs mb-4">
          SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
            CLOSE
          </Button>
          <Button size="sm" onClick={() => setModalOpen(false)}>
            CONFIRM
          </Button>
        </div>
      </Modal>
    </div>
  );
}
