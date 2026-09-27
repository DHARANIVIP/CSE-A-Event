import React from "react";
import type { Metadata } from "next";
import { DetectiveCaseIntro } from "@/components/intro/DetectiveCaseIntro";

export const metadata: Metadata = {
  title: "CASE FILE № 2K26 — DETECTRIX Intro",
  description: "Cinematic detective case file intro sequence for DETECTRIX Hackathon.",
};

export default function IntroPage() {
  return <DetectiveCaseIntro />;
}
