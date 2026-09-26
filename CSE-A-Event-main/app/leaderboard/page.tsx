"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trophy } from "@/components/icons";

export default function LeaderboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/case?leaderboard=open");
  }, [router]);

  return (
    <div className="max-w-xl mx-auto py-16 text-center space-y-4 font-mono text-sm text-ink">
      <div className="w-14 h-14 mx-auto rounded-full bg-gold/20 border-2 border-ink flex items-center justify-center text-ink">
        <Trophy size={28} />
      </div>
      <h1 className="font-display text-2xl uppercase font-black text-crimson">
        REDIRECTING TO CASE FILES LEADERBOARD...
      </h1>
      <p className="text-muted text-xs">
        The official Detectrix live leaderboard is integrated into the Case Files workspace sidebar.
      </p>
      <Link
        href="/case?leaderboard=open"
        className="inline-block px-5 py-2.5 bg-crimson text-paper border-2 border-ink rounded font-mono text-xs font-bold uppercase tracking-wider shadow-hard"
      >
        GO TO CASE FILES & LEADERBOARD →
      </Link>
    </div>
  );
}
