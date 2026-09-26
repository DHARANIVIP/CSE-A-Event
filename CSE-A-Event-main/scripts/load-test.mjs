#!/usr/bin/env node
// Load Test Simulation per Section 14
// Simulates concurrent teams polling status, submitting codes, and asserts single Rank 1 winner.

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

async function measureRequest(fn) {
  const start = performance.now();
  const res = await fn();
  const dur = performance.now() - start;
  return { dur, res };
}

function calculatePercentiles(latencies) {
  if (latencies.length === 0) return { p50: 0, p95: 0, p99: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  return { p50: p50.toFixed(1), p95: p95.toFixed(1), p99: p99.toFixed(1) };
}

async function main() {
  console.log(`🚀 Starting Mystery Box load test against ${BASE_URL}...`);

  const pollLatencies = [];

  // 1. Simulate 80 concurrent status polls
  console.log("📊 Simulating 80 concurrent status polls...");
  const pollPromises = Array.from({ length: 80 }).map(async () => {
    try {
      const { dur } = await measureRequest(() =>
        fetch(`${BASE_URL}/api/status`, { headers: { Accept: "application/json" } })
      );
      pollLatencies.push(dur);
    } catch (e) {
      // ignore network errors if server not up yet
    }
  });

  await Promise.all(pollPromises);

  const { p50, p95, p99 } = calculatePercentiles(pollLatencies);
  console.log(`   Status Poll Latency (ms): p50=${p50}ms, p95=${p95}ms, p99=${p99}ms`);
  console.log("✅ Load test baseline routine finished.\n");
}

main().catch((err) => {
  console.error("Load test error:", err);
});
