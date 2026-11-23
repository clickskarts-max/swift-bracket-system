import { jsPDF } from "jspdf";
import autoTable, { type RowInput } from "jspdf-autotable";
import { formatDate } from "@/lib/app";
import { fixturePdfModel, type FixturePdfInput, type FixturePdfOptions } from "@/lib/fixture-pdf-model";
export type { FixturePdfInput, FixturePdfOptions } from "@/lib/fixture-pdf-model";

export function buildFixturePdf(input: FixturePdfInput, blankRows?: number, options: FixturePdfOptions = {}): Blob {
  if (options.layout === "tiesheet") return buildTieSheetPdf(input, options);
  const model = fixturePdfModel(input, options);
  const blank = blankRows !== undefined;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 12;
  const title = blank ? "Blank tie-sheet" : "Fixture sheet";
  const heading = options.heading?.trim() || input.tournamentName;
  const details = [input.format, `${input.teams?.length ?? 0} teams`, `${model.gameCount} active games`,
    input.startDate ? `${formatDate(input.startDate)}${input.endDate ? ` to ${formatDate(input.endDate)}` : ""} BS` : ""].filter(Boolean).join(" | ");
  const plan = input.settings;
  const planText = plan ? `League: ${plan.leagueLimit}/day${plan.timingMode === "fixed" ? ` x ${plan.leagueDays} days` : ""} | Knockout: ${plan.knockoutLimit}/day${plan.timingMode === "fixed" ? ` x ${plan.knockoutDays} days` : ""} | Rest: ${plan.restHours}h | Game: ${plan.durationMinutes} min` : "";
  const headerTop = 51;
  doc.setProperties({ title: `${input.tournamentName} - ${title}`, subject: title, creator: "Ecluid Basketball" });
  const header = () => {
    const textX = options.logo ? margin + 25 : margin;
    if (options.logo) doc.addImage(options.logo, "PNG", margin, 10, 20, 20);
    doc.setTextColor(25); doc.setFont("helvetica", "bold"); doc.setFontSize(15);
    doc.text((doc.splitTextToSize(heading, width - textX - margin) as string[]).slice(0, 2), textX, 16);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    const parent = heading !== input.tournamentName ? `${input.tournamentName} | ` : "";
    doc.text((doc.splitTextToSize(`${parent}${options.subheading?.trim() || title}`, width - textX - margin) as string[]).slice(0, 1), textX, 30);
    doc.text((doc.splitTextToSize(details, width - margin * 2) as string[]).slice(0, 1), margin, 37);
    if (planText) doc.text(planText, margin, 43);
    doc.setDrawColor(150); doc.line(margin, 47, width - margin, 47);
  };
  let y = headerTop;
  header();
  const table = (head: string[], body: RowInput[], section?: string) => {
    if (y > height - 45) { doc.addPage(); header(); y = headerTop; }
    const rows: RowInput[] = section ? [[{ content: section, colSpan: head.length, styles: { fontStyle: "bold", fillColor: 225, minCellHeight: 9 } }], ...body] : body;
    autoTable(doc, {
      head: [head], body: rows, startY: y,
      margin: { top: headerTop, bottom: 17, left: margin, right: margin }, theme: "grid",
      styles: { font: "helvetica", fontSize: 8, cellPadding: 2.2, minCellHeight: blank ? 11 : 10, lineColor: 175, lineWidth: 0.2, textColor: 25, overflow: "linebreak", valign: "middle" },
      headStyles: { fillColor: 45, textColor: 255, fontStyle: "bold" }, rowPageBreak: "avoid", willDrawPage: header,
    });
    y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 7;
  };
  if (!blank && options.showGroups !== false && model.groups.length) {
    table(["Group", "Teams", "Team count"], model.groups.map(([group, names]) => [group, names.join(" / "), String(names.length)]), "Group assignments");
  }
  if (blank) {
    const count = Math.max(1, Math.min(200, Math.trunc(blankRows)));
    table(model.headings, Array.from({ length: count }, (_, index) => model.columns.map(column => column.key === "number" ? String(index + 1) : "")));
    doc.addPage(); header(); doc.setFontSize(10); doc.text("Tie-sheet drawing / team assignments", margin, 56);
    doc.setDrawColor(210); doc.setLineWidth(0.15);
    for (let line = 62; line < height - 20; line += 10) doc.line(margin, line, width - margin, line);
    for (let x = margin; x <= width - margin; x += 10) doc.line(x, 62, x, height - 20);
  } else {
    for (const day of model.days) {
      const appearances = new Map<string, number>();
      for (const match of day.matches) {
        if (match.status === "forfeit") continue;
        for (const id of new Set([match.team_a_id, match.team_b_id])) if (id) appearances.set(id, (appearances.get(id) ?? 0) + 1);
      }
      const repeat = [...appearances].filter(([, count]) => count > 1).map(([id, count]) => `${input.teams?.find(team => team.id === id)?.name ?? id}: ${count} games`);
      const info = `${day.label} | ${day.date} | ${day.matches.length} ${day.matches.length === 1 ? "game" : "games"}${repeat.length ? `\nMultiple games: ${repeat.join("; ")}` : ""}`;
      table(model.headings, day.matches.map(match => model.columns.map(column => model.cell(match, column))), info);
    }
  }
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(100);
    if (input.tournamentUrl) doc.textWithLink("Parent tournament", margin, height - 7, { url: input.tournamentUrl });
    else doc.text(input.tournamentName, margin, height - 7);
    doc.text(`${page} / ${pages}`, width - margin, height - 7, { align: "right" });
  }
  return doc.output("blob");
}

const time = (iso: string | null) => iso ? new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";

/** Classic printed tie-sheet: centred titles, numbered pools side by side, one table per day. */
export function buildTieSheetPdf(input: FixturePdfInput, options: FixturePdfOptions = {}): Blob {
  const model = fixturePdfModel(input, options);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 18;
  const blankHome = model.columns.some(c => c.key === "home" && c.blank);
  const blankAway = model.columns.some(c => c.key === "away" && c.blank);
  const showTime = !model.columns.some(c => c.key === "date" && c.blank);
  doc.setProperties({ title: `${input.tournamentName} - Tie sheet`, creator: "Ecluid Basketball" });
  let y = 18;
  if (options.logo) { doc.addImage(options.logo, "PNG", width / 2 - 9, y - 6, 18, 18); y += 16; }
  doc.setTextColor(25); doc.setFont("helvetica", "bold"); doc.setFontSize(15);
  for (const line of doc.splitTextToSize(options.heading?.trim() || input.tournamentName, width - margin * 2) as string[]) { doc.text(line, width / 2, y, { align: "center" }); y += 6; }
  doc.setFont("helvetica", "normal"); doc.setFontSize(11);
  const sub = options.subheading?.trim();
  if (sub) for (const line of sub.split("\n")) { doc.text(line, width / 2, y, { align: "center" }); y += 5.5; }
  y += 6;
  if (options.showGroups !== false && model.groups.length) {
    const cols = Math.min(model.groups.length, 4);
    const colWidth = (width - margin * 2) / cols;
    for (let start = 0; start < model.groups.length; start += cols) {
      const slice = model.groups.slice(start, start + cols);
      const rows = Math.max(...slice.map(([, names]) => names.length));
      if (y + 8 + rows * 6 > height - 15) { doc.addPage(); y = 18; }
      slice.forEach(([group, names], index) => {
        const x = margin + index * colWidth + 6;
        doc.setFont("helvetica", "bold"); doc.setFontSize(11);
        doc.text(group.replace(/^Group /, "Pool - "), x + 8, y);
        doc.setFont("helvetica", "normal"); doc.setFontSize(10);
        names.forEach((name, row) => {
          doc.text(String(row + 1), x, y + 7 + row * 6);
          if (blankHome && blankAway) doc.line(x + 6, y + 7 + row * 6 + 0.8, x + colWidth - 12, y + 7 + row * 6 + 0.8);
          else doc.text(doc.splitTextToSize(name, colWidth - 14)[0] as string, x + 6, y + 7 + row * 6);
        });
      });
      y += 10 + rows * 6 + 6;
    }
  }
  const seed = (id: string | null) => (id && model.seeds.get(id)) ? String(model.seeds.get(id)) : "";
  for (const day of model.days) {
    const rows = day.matches.length;
    if (y + 16 + rows * 9 > height - 15) { doc.addPage(); y = 18; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(25);
    doc.text(day.date, margin, y); y += 2;
    autoTable(doc, {
      startY: y, margin: { left: margin, right: margin, bottom: 15 }, theme: "grid",
      head: [["Match No.", "Pool", "Teams", ...(showTime ? ["Time"] : [])]],
      body: day.matches.map(match => {
        const home = blankHome ? "" : input.label(match, "a").name;
        const away = blankAway ? "" : input.label(match, "b").name;
        const pool = match.group_label ?? match.round_name ?? "";
        return [String(model.cell(match, { key: "number" })).replace(/^M/, ""), pool, { content: `${home}`, seedA: blankHome ? "" : seed(match.team_a_id), seedB: blankAway ? "" : seed(match.team_b_id), away } as never, ...(showTime ? [time(match.scheduled_at)] : [])];
      }),
      styles: { font: "helvetica", fontSize: 10, textColor: 25, lineColor: 60, lineWidth: 0.3, minCellHeight: 9, valign: "middle", halign: "center" },
      headStyles: { fillColor: 255, textColor: 25, fontStyle: "normal" },
      columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 18 }, ...(showTime ? { 3: { cellWidth: 28 } } : {}) },
      didParseCell: data => { if (data.section === "body" && data.column.index === 2) data.cell.text = [""]; },
      didDrawCell: data => {
        if (data.section !== "body" || data.column.index !== 2) return;
        const raw = data.cell.raw as { content: string; seedA: string; seedB: string; away: string };
        const { x, y: top, width: w, height: h } = data.cell;
        const mid = top + h / 2 + 1.3;
        doc.setFontSize(6); doc.text(raw.seedA, x + 1.5, top + 3); doc.text(raw.seedB, x + w - 1.5, top + 3, { align: "right" });
        doc.setFontSize(10);
        doc.text(raw.content, x + 5, mid, { maxWidth: w / 2 - 12 });
        doc.text("Vs", x + w / 2, mid, { align: "center" });
        doc.text(raw.away, x + w / 2 + 6, mid, { maxWidth: w / 2 - 10 });
      },
    });
    y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 12;
  }
  return doc.output("blob");
}
