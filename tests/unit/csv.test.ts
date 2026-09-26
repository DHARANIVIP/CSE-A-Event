import { describe, it, expect } from "vitest";
import { parseCSV, parseTeamsCSV, exportToCSV } from "@/lib/csv";

describe("CSV Parser & Exporter (lib/csv.ts)", () => {
  it("correctly parses RFC 4180 CSV with quotes, commas, and escapes", () => {
    const raw = 'col1,"col,with,comma","col with ""quote"""\nval1,val2,val3';
    const rows = parseCSV(raw);

    expect(rows).toHaveLength(2);
    expect(rows[0][0]).toBe("col1");
    expect(rows[0][1]).toBe("col,with,comma");
    expect(rows[0][2]).toBe('col with "quote"');
    expect(rows[1][0]).toBe("val1");
  });

  it("parses team CSV roster and generates PIN when blank", () => {
    const csv = `team_id,team_name,members,pin
TEAM-01,Cipher Enigma,Alice;Bob;Charlie,123456
TEAM-02,Binary Shadows,David;Eva;Frank,
`;

    const { teams, errors } = parseTeamsCSV(csv);

    expect(errors).toHaveLength(0);
    expect(teams).toHaveLength(2);

    expect(teams[0].team_id).toBe("TEAM-01");
    expect(teams[0].members).toEqual(["Alice", "Bob", "Charlie"]);
    expect(teams[0].pin).toBe("123456");
    expect(teams[0].pinGenerated).toBe(false);

    expect(teams[1].team_id).toBe("TEAM-02");
    expect(teams[1].pin).toMatch(/^\d{6}$/);
    expect(teams[1].pinGenerated).toBe(true);
  });

  it("detects and flags invalid team rows", () => {
    const invalidCsv = `team_id,team_name,members,pin
T,Too Short Name,Alice,123456
TEAM-OK,Valid Name,Bob,badpin
`;

    const { teams, errors } = parseTeamsCSV(invalidCsv);
    expect(errors.length).toBeGreaterThan(0);
    expect(teams).toHaveLength(0);
  });

  it("exports tabular data to CSV with cell escaping", () => {
    const headers = ["id", "name", "desc"];
    const rows = [
      ["1", "Alice", 'Normal text'],
      ["2", "Bob", 'Text with, comma and "quotes"'],
    ];

    const exported = exportToCSV(headers, rows);
    expect(exported).toContain('id,name,desc');
    expect(exported).toContain('"Text with, comma and ""quotes"""');
  });
});
