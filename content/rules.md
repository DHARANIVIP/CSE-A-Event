# Official Event Rules & Regulations
*Mystery Box – The Digital Case*

Please read these rules carefully before the investigation commences. Every participant must abide by these guidelines.

---

### Rule 1: Team Composition
- Teams must consist of strictly **3 to 4 registered 2nd-year CSE students**.
- Individual participation or unauthorized team substitution is prohibited.

### Rule 2: Permitted Tools & Equipment
- Teams are encouraged to use any technical tooling at their disposal: **Python, pandas, SQL, Excel, terminal command-line tools (grep, awk, sed), Wireshark, Jupyter Notebooks**, and modern **AI assistants (LLMs)**.
- Any tool that assists your team in investigating the logs and deriving the answer is permitted.

### Rule 3: Derivation Requirement
- The 5-character access code is **not directly searchable** as plaintext anywhere in the raw evidence files.
- It must be derived through careful forensic deduction by solving questions Q1 through Q5 in sequence.

### Rule 4: Prohibition on Inter-Team Collusion
- Collaborating, sharing answers, trading intermediate tokens, or leaking access codes between teams is strictly prohibited.
- Any attempt to share codes, or to submit on behalf of another team, will result in **immediate disqualification** of all involved teams.

### Rule 5: Ranking by Authoritative Server Timestamp
- The winning team is determined strictly by the **earliest Postgres server timestamp** (`clock_timestamp()`) recorded for a correct submission.
- Client computer clocks, network latency differences, and local system times do not affect the official ranking.

### Rule 6: Submission Rate Limits & Escalating Cooldowns
To prevent brute-force attacks and automated script submissions, the Mystery Box enforces strict rate limiting:
- **Maximum 5 submissions** per rolling 60-second window.
- **Escalating Cooldown Schedule**:
  - After **3 consecutive incorrect attempts**: 30 seconds lockout.
  - Subsequent incorrect attempts escalate cooldown to **60s, 120s, 240s**, and cap at **300 seconds (5 minutes)**.
  - Cooldown timers reset only after a correct submission or after 10 minutes of inactivity.

### Rule 7: Hint Release Schedule
- Official hints will be unlocked periodically during the event via the **Hints** portal.
- Hints may be released either at pre-scheduled times or on-demand by the event organizers depending on the collective progress of the cohorts.

### Rule 8: Finality of Organizer Decisions
- In the event of technical disputes, network disruptions, or suspected malpractice, the decision of the faculty coordinators and event lead organizers is **final and binding**.
