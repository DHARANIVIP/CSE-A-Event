# Case Briefing: The Midnight Grade Leak
*Incident Reference: CASE-2026-CSE-0919*
*Classification: Confidential — Registered Investigator Teams Only*
*Status: Active Investigation*

<!-- EDITABLE CONTENT: Organizers can modify the briefing narrative below -->

## 1. Incident Overview

At **02:17 AM** on Friday morning, the Department of Computer Science & Engineering server room detected an anomalous outbound transmission. An unauthorized archive containing encrypted evaluation ledgers, semester examination drafts, and faculty access tokens was staged for exfiltration.

The intrusion triggered the automated perimeter defense, severing the network connection before the transmission could finish. However, the attacker left behind an obfuscated 5-character cryptographic lock on the recovery terminal. 

Unless the recovery terminal's **Mystery Box** is unlocked with the exact 5-character access code, the compromised system ledgers will be permanently corrupted at the close of this investigation window.

---

## 2. Your Mission

Your team of forensic analysts has been deployed with raw sector dumps, server logs, network captures, and sensor logs. 

Your objective is to:
1. Trace the adversary's path across the internal network.
2. Cross-reference the forensic evidence files provided in the case archive.
3. Solve the **5 forensic investigative questions** in exact sequence.
4. Synthesize the derived clues to reveal the **5-character access code**.
5. Input the code into the **Mystery Box** portal before the deadline.

---

## 3. Evidence Artifacts in the Case Archive

The case archive (`mystery-case-archive.zip`) contains the following forensic datasets:

| Filename | Format | Description | Expected Records |
|---|---|---|---|
| `system_logs.txt` | Syslog / UTF-8 | Firewall drop rules and auth daemon entries | ~4,200 lines |
| `devices.csv` | CSV | DHCP lease mappings, MAC addresses, and VLAN IDs | 150 rows |
| `access_logs.csv` | CSV | Badge reader timestamps for Server Room 3B | 620 rows |
| `login_logs.csv` | CSV | SSO session authentication timestamps and IPs | 1,840 rows |
| `network_traffic.csv`| CSV | Packet metadata, ports, payloads, and checksums | 12,500 rows |

---

## 4. Key Rules of Engagement

- **Data Integrity**: Answers must be derived methodically from the evidence files using Python, pandas, SQL, Excel, terminal utilities, or AI models.
- **Sequential Chaining**: The output of each question unlocks the search parameters for the subsequent question.
- **Code Structure**: Each of the 5 questions yields exactly **one** alphanumeric character (`A–Z`, `0–9`). Combining them in order (`q1 + q2 + q3 + q4 + q5`) yields the access key.
- **Fair Play**: Sharing forensic indicators or access codes with other teams results in immediate disqualification.
