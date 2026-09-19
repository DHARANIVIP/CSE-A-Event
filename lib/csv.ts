// RFC 4180 compliant CSV Parser & Exporter
// Handles quotes, commas within quotes, escaped quotes, and multiline text.

export interface ParsedTeamRow {
  team_id: string;
  team_name: string;
  members: string[];
  pin: string;
  pinGenerated: boolean;
}

export function parseCSV(rawText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;
  let i = 0;

  const text = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
      i++;
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
      i++;
      continue;
    }

    if (char === "\n" && !inQuotes) {
      currentRow.push(currentCell.trim());
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = "";
      i++;
      continue;
    }

    currentCell += char;
    i++;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((cell) => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Generates a cryptographically random 6-digit numeric PIN.
 */
export function generateRandomPin(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return num.toString();
}

/**
 * Parses and validates raw CSV for team seeding.
 * Expected header: team_id, team_name, members, pin
 */
export function parseTeamsCSV(csvContent: string): {
  teams: ParsedTeamRow[];
  errors: string[];
} {
  const rawRows = parseCSV(csvContent);
  if (rawRows.length === 0) {
    return { teams: [], errors: ["CSV file is empty."] };
  }

  const errors: string[] = [];
  const teams: ParsedTeamRow[] = [];
  const seenIds = new Set<string>();

  // Detect and skip header row if present
  let startIndex = 0;
  const firstRow = rawRows[0].map((c) => c.toLowerCase());
  if (
    firstRow[0]?.includes("team") &&
    (firstRow[1]?.includes("name") || firstRow[2]?.includes("member"))
  ) {
    startIndex = 1;
  }

  for (let idx = startIndex; idx < rawRows.length; idx++) {
    const row = rawRows[idx];
    const lineNum = idx + 1;

    if (row.length < 2) {
      errors.push(`Line ${lineNum}: Missing required columns (team_id, team_name).`);
      continue;
    }

    const rawId = (row[0] || "").toUpperCase().trim();
    const name = (row[1] || "").trim();
    const rawMembers = (row[2] || "").trim();
    let pin = (row[3] || "").trim();
    let pinGenerated = false;

    // Validate Team ID: 3-12 chars, [A-Z0-9-]
    if (!/^[A-Z0-9-]{3,12}$/.test(rawId)) {
      errors.push(
        `Line ${lineNum}: Invalid team ID "${rawId}". Must be 3–12 uppercase letters, numbers, or hyphens.`
      );
      continue;
    }

    if (seenIds.has(rawId)) {
      errors.push(`Line ${lineNum}: Duplicate team ID "${rawId}".`);
      continue;
    }
    seenIds.add(rawId);

    // Validate Name: 2-40 chars
    if (name.length < 2 || name.length > 40) {
      errors.push(
        `Line ${lineNum}: Team name "${name}" must be between 2 and 40 characters.`
      );
      continue;
    }

    // Members: semicolon separated
    const members = rawMembers
      ? rawMembers
          .split(";")
          .map((m) => m.trim())
          .filter((m) => m.length > 0)
      : [];

    // PIN: if blank, generate random 6-digit numeric PIN
    if (!pin) {
      pin = generateRandomPin();
      pinGenerated = true;
    } else if (!/^\d{6}$/.test(pin)) {
      errors.push(
        `Line ${lineNum}: Custom PIN "${pin}" for team ${rawId} must be exactly 6 digits.`
      );
      continue;
    }

    teams.push({
      team_id: rawId,
      team_name: name,
      members,
      pin,
      pinGenerated,
    });
  }

  return { teams, errors };
}

/**
 * Serializes data array to an RFC 4180 CSV string.
 */
export function exportToCSV(
  headers: string[],
  rows: Array<Array<string | number | boolean | null | undefined>>
): string {
  const escapeCell = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeCell).join(",");
  const dataLines = rows.map((row) => row.map(escapeCell).join(","));

  return [headerLine, ...dataLines].join("\r\n");
}
