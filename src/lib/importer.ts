export type ParsedFixture = {
  matchNo: number | null;
  teamA: string;
  teamB: string;
  dateLabel: string | null;
  time: string | null;
  roundName: string | null;
};

export type ParsedSchedule = {
  fixtures: ParsedFixture[];
  teams: string[];
  detectedFormat: string;
  detectedLegs: number;
  detectedPlayoff: string;
  notes: string[];
  rawText: string;
};

const PLACEHOLDER_RE =
  /^(seed|winner|loser|runner|qualifier|eliminator|tbd|bye|edge|team [ab])\b/i;

const clean = (s: string) =>
  s
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/^[\s.\-–—|]+|[\s.\-–—|]+$/g, "")
    .trim();

const isPlaceholder = (s: string) => !s || PLACEHOLDER_RE.test(s);

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) {
    const pdfjs = await import("pdfjs-dist");
    const workerUrl = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const buf = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    let text = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      let lastY: number | null = null;
      for (const item of content.items as { str: string; transform: number[] }[]) {
        const y = item.transform?.[5] ?? 0;
        if (lastY !== null && Math.abs(y - lastY) > 2) text += "\n";
        text += item.str + " ";
        lastY = y;
      }
      text += "\n\n";
    }
    return text;
  }
  return await file.text();
}

function parseXml(text: string): ParsedFixture[] {
  if (typeof window === "undefined" || !text.trim().startsWith("<")) return [];
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.querySelector("parsererror")) return [];
  const nodes = Array.from(doc.querySelectorAll("match, Match, fixture, Fixture, game, Game"));
  const val = (el: Element, keys: string[]) => {
    for (const k of keys) {
      const attr = el.getAttribute(k);
      if (attr) return attr;
      const child = el.querySelector(k);
      if (child?.textContent) return child.textContent;
    }
    return "";
  };
  return nodes
    .map((el, i) => {
      const teamA = clean(val(el, ["home", "homeTeam", "teamA", "team1", "home_team"]));
      const teamB = clean(val(el, ["away", "awayTeam", "teamB", "team2", "away_team"]));
      const date = clean(val(el, ["date", "datetime", "start", "kickoff"]));
      const time = clean(val(el, ["time", "reporting_time"]));
      const round = clean(val(el, ["round", "stage", "group", "phase"]));
      const no = clean(val(el, ["number", "no", "matchNo", "id"]));
      return {
        matchNo: Number(no) || i + 1,
        teamA,
        teamB,
        dateLabel: date || null,
        time: time || null,
        roundName: round || null,
      };
    })
    .filter((f) => f.teamA && f.teamB);
}

function parseText(text: string): { fixtures: ParsedFixture[]; notes: string[] } {
  const lines = text.split(/\r?\n/).map(clean).filter(Boolean);
  const fixtures: ParsedFixture[] = [];
  const notes: string[] = [];
  let currentDate: string | null = null;
  let currentRound: string | null = null;

  const dateLike =
    /(\d{1,2}(st|nd|rd|th)?\s+\w+[^|]*?(sunday|monday|tuesday|wednesday|thursday|friday|saturday))|(\d{4}-\d{2}-\d{2})|(\d{1,2}\/\d{1,2}\/\d{2,4})/i;
  const roundLike =
    /(round robin\s*\d*|playoff|qualifier\s*\d*|eliminator|semi ?final|quarter ?final|pre-?quarter|final|group\s+[a-h]|league)/i;

  for (const line of lines) {
    const timeMatch = line.match(/(\d{1,2}[:.]\d{2}\s*(am|pm)?)/i);
    const vsMatch = line.match(/^(?:(\d{1,3})[).\s|]+)?(.+?)\s+(?:vs\.?|v\/s|versus|\bv\b|–|—)\s+(.+)$/i);
    if (vsMatch) {
      let a = clean(vsMatch[2] ?? "");
      let b = clean(vsMatch[3] ?? "");
      if (timeMatch) b = clean(b.replace(timeMatch[0], ""));
      a = a.replace(/^\|+/, "").trim();
      b = b.replace(/\|+$/, "").trim();
      if (a.length > 40 || b.length > 40) continue;
      fixtures.push({
        matchNo: vsMatch[1] ? Number(vsMatch[1]) : null,
        teamA: a,
        teamB: b,
        dateLabel: currentDate,
        time: timeMatch ? clean(timeMatch[0]).toUpperCase() : null,
        roundName: currentRound,
      });
      continue;
    }
    if (dateLike.test(line) && line.length < 90) currentDate = line;
    const r = line.match(roundLike);
    if (r && line.length < 90) currentRound = clean(r[0]);
  }
  if (!fixtures.length) notes.push("No 'Team A vs Team B' rows were detected in this file.");
  return { fixtures, notes };
}

export function analyzeSchedule(text: string): ParsedSchedule {
  const notes: string[] = [];
  const xml = parseXml(text);
  const { fixtures: textFixtures, notes: textNotes } = xml.length ? { fixtures: xml, notes: [] } : parseText(text);
  const fixtures = xml.length ? xml : textFixtures;
  notes.push(...textNotes);

  const realFixtures = fixtures.filter((f) => !isPlaceholder(f.teamA) && !isPlaceholder(f.teamB));
  const teamMap = new Map<string, string>();
  realFixtures.forEach((f) => {
    [f.teamA, f.teamB].forEach((t) => {
      const key = t.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (key && !teamMap.has(key)) teamMap.set(key, t);
    });
  });
  const teams = [...teamMap.values()];

  // Count how many times each unordered pair appears -> legs
  const pairCount = new Map<string, number>();
  realFixtures.forEach((f) => {
    const key = [f.teamA, f.teamB]
      .map((t) => t.toLowerCase().replace(/[^a-z0-9]/g, ""))
      .sort()
      .join("|");
    pairCount.set(key, (pairCount.get(key) ?? 0) + 1);
  });
  const counts = [...pairCount.values()];
  const detectedLegs = counts.length ? Math.max(1, Math.round(counts.reduce((a, b) => a + b, 0) / counts.length)) : 1;

  const lower = text.toLowerCase();
  const hasGroups = /group\s+[a-h]\b|pool\s+[a-h]\b/.test(lower);
  const hasQualifier = /qualifier/.test(lower) && /eliminator/.test(lower);
  const hasPlayoff = /play\s?-?off/.test(lower);
  const hasBracketOnly = /quarter ?final/.test(lower) && teams.length > 0 && realFixtures.length < teams.length;

  let detectedFormat = "round_robin";
  if (hasGroups) detectedFormat = "group_knockout";
  else if (hasBracketOnly) detectedFormat = "single_elimination";
  else if (detectedLegs > 1) detectedFormat = "round_robin";
  else if (/league/.test(lower)) detectedFormat = "league";

  let detectedPlayoff = "none";
  if (hasQualifier) detectedPlayoff = "top4_ipl";
  else if (hasPlayoff && /semi ?final/.test(lower)) detectedPlayoff = "top4_semis";
  else if (hasPlayoff) detectedPlayoff = "top2_final";

  if (teams.length) notes.push(`${teams.length} teams and ${realFixtures.length} fixtures detected.`);
  if (fixtures.length !== realFixtures.length)
    notes.push(`${fixtures.length - realFixtures.length} placeholder rows (seeds/winners) were skipped.`);

  return { fixtures: realFixtures, teams, detectedFormat, detectedLegs, detectedPlayoff, notes, rawText: text };
}
