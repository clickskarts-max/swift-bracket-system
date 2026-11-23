import { AlignmentType, Document, ImageRun, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { fixturePdfModel, type FixturePdfInput, type FixturePdfOptions } from "@/lib/fixture-pdf-model";

/** Editable OOXML document built from loaded fixture data, never from database writes. */
export async function buildFixtureWord(input: FixturePdfInput, options: FixturePdfOptions = {}): Promise<Blob> {
  const model = fixturePdfModel(input, options);
  const centered = (text: string, bold = false, size = 24) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 140 }, children: [new TextRun({ text, bold, size })] });
  const table = (headers: string[], rows: string[][], rowHeight = 520) => new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headers, ...rows].map((row, index) => new TableRow({
      tableHeader: index === 0, cantSplit: true, height: { value: rowHeight, rule: "atLeast" },
      children: row.map(text => new TableCell({
        width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
        margins: { top: 90, bottom: 90, left: 110, right: 110 },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: index === 0, size: 21 })] })],
      })),
    })),
  });
  const children: (Paragraph | Table)[] = [];
  if (options.logo) {
    const base64 = options.logo.split(",")[1];
    if (base64) children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: "png", data: Uint8Array.from(atob(base64), char => char.charCodeAt(0)), transformation: { width: 76, height: 76 } })] }));
  }
  children.push(centered(options.heading?.trim() || input.tournamentName, true, 30));
  for (const line of options.subheading?.split("\n") ?? []) children.push(centered(line));
  if (options.layout === "table") {
    children.push(centered(`${input.tournamentName} | ${input.teams?.length ?? 0} teams | ${model.gameCount} active games`, false, 18));
    const plan = input.settings;
    if (plan) children.push(centered(`League: ${plan.leagueLimit}/day${plan.timingMode === "fixed" ? ` x ${plan.leagueDays} days` : ""} | Knockout: ${plan.knockoutLimit}/day${plan.timingMode === "fixed" ? ` x ${plan.knockoutDays} days` : ""} | Rest: ${plan.restHours}h | Game: ${plan.durationMinutes} min`, false, 18));
  }
  if (options.showGroups !== false && model.groups.length) {
    for (let index = 0; index < model.groups.length; index += 4) {
      const groups = model.groups.slice(index, index + 4);
      const count = Math.max(...groups.map(([, names]) => names.length));
      children.push(table(groups.map(([label]) => label.replace(/^Group /, "Pool - ")), Array.from({ length: count }, (_, row) => groups.map(([, names]) => row < names.length ? `${row + 1}. ${names[row] ?? ""}` : "")), 620), new Paragraph({ spacing: { after: 180 } }));
    }
  }
  for (const day of model.days) {
    children.push(new Paragraph({ keepNext: true, spacing: { before: 220, after: 120 }, children: [new TextRun({ text: `${day.label} | ${day.date}`, bold: true, size: 24 })] }));
    if (options.layout === "table") children.push(table(model.headings, day.matches.map(match => model.columns.map(column => model.cell(match, column)))));
    else {
      const timeColumn = model.columns.find(column => column.key === "date");
      const showTime = !timeColumn?.blank;
      const homeColumn = model.columns.find(column => column.key === "home");
      const awayColumn = model.columns.find(column => column.key === "away");
      children.push(table(["Match No.", "Pool", "Teams", ...(showTime ? ["Time"] : [])], day.matches.map(match => {
        const home = model.cell(match, homeColumn ?? { key: "home" });
        const away = model.cell(match, awayColumn ?? { key: "away" });
        return [model.cell(match, { key: "number" }).replace(/^M/, ""), match.group_label ?? match.round_name ?? "", `${home}     Vs     ${away}`, ...(showTime ? [match.scheduled_at ? new Date(match.scheduled_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : ""] : [])];
      })));
    }
  }
  return Packer.toBlob(new Document({ creator: "Ecluid Basketball", title: `${input.tournamentName} - Fixture sheet`, sections: [{ properties: { page: { size: { width: options.layout === "table" ? 16838 : 11906, height: options.layout === "table" ? 11906 : 16838 }, margin: { top: 900, bottom: 900, left: 1000, right: 1000 } } }, children }] }));
}