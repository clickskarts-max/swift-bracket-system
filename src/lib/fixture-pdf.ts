import { jsPDF } from "jspdf";
import autoTable, { type RowInput } from "jspdf-autotable";
import { formatDate, isFinalStatus } from "@/lib/app";
import { fixtureDisplayNumbers } from "@/lib/fixture-display";
import type { Match } from "@/lib/queries";

export type FixturePdfInput = {
  tournamentName: string;
  matches: Match[];
  label: (match: Match, side: "a" | "b") => { name: string };
  venue: (match: Match) => string;
  matchday: (match: Match) => string;
};

export function buildFixturePdf(input: FixturePdfInput, blankRows?: number): Blob {
  const blank = blankRows !== undefined;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 12;
  const title = blank ? "Blank tie-sheet" : "Fixture sheet";
  doc.setProperties({ title: `${input.tournamentName} - ${title}`, subject: title, creator: "Ecluid Basketball" });
  const header = () => {
    doc.setTextColor(25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    const lines = doc.splitTextToSize(input.tournamentName, width - margin * 2) as string[];
    doc.text(lines.slice(0, 2), margin, 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`${title}  |  ${blank ? "Team names, dates, times and scores left blank" : "All active games in playing order | Dates: BS | Times: local"}`, margin, 34);
  };
  const numbers = fixtureDisplayNumbers(input.matches);
  const ordered = input.matches.filter(match => match.status !== "cancelled")
    .sort((a, b) => (numbers.get(a.id) ?? 0) - (numbers.get(b.id) ?? 0));
  const body: RowInput[] = [];
  if (blank) {
    const count = Math.max(1, Math.min(200, Math.trunc(blankRows)));
    for (let index = 0; index < count; index++) body.push([String(index + 1), "", "", "", "", "", "", "", ""]);
  } else {
    let lastDay = "";
    for (const match of ordered) {
      const day = input.matchday(match);
      if (day !== lastDay) {
        body.push([{ content: `${day}${match.scheduled_at ? `  |  ${formatDate(match.scheduled_at)} BS` : ""}`, colSpan: 9, styles: { fontStyle: "bold", fillColor: 236, minCellHeight: 8 } }]);
        lastDay = day;
      }
      body.push([
        `M${numbers.get(match.id) ?? ""}`, day,
        match.scheduled_at ? `${formatDate(match.scheduled_at)}\n${new Date(match.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "TBD",
        match.group_label ? `Group ${match.group_label}` : match.round_name ?? match.stage,
        input.label(match, "a").name,
        isFinalStatus(match.status) ? `${match.score_a ?? 0} - ${match.score_b ?? 0}` : "",
        input.label(match, "b").name,
        input.venue(match),
        match.status === "forfeit" ? "FORFEIT" : match.status === "completed" ? "Final" : match.status,
      ]);
    }
  }
  autoTable(doc, {
    head: [["Match", "Matchday", "Date / time", "Group / round", "Home team", "Score", "Away team", "Venue", "Status"]],
    body,
    startY: 41,
    margin: { top: 41, bottom: 14, left: margin, right: margin },
    theme: "grid",
    styles: { font: "helvetica", fontSize: 8, cellPadding: 2.2, minCellHeight: blank ? 11 : 10, lineColor: 175, lineWidth: 0.2, textColor: 25, overflow: "linebreak", valign: "middle" },
    headStyles: { fillColor: 45, textColor: 255, fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 14 }, 1: { cellWidth: 23 }, 2: { cellWidth: 29 }, 3: { cellWidth: 34 }, 4: { cellWidth: 44 }, 5: { cellWidth: 18 }, 6: { cellWidth: 44 }, 7: { cellWidth: 39 }, 8: { cellWidth: 28 } },
    rowPageBreak: "avoid",
    willDrawPage: header,
  });
  if (blank) {
    doc.addPage();
    header();
    doc.setFontSize(10);
    doc.text("Tie-sheet drawing / team assignments", margin, 46);
    doc.setDrawColor(210);
    doc.setLineWidth(0.15);
    for (let y = 52; y < height - 20; y += 10) doc.line(margin, y, width - margin, y);
    for (let x = margin; x <= width - margin; x += 10) doc.line(x, 52, x, height - 20);
  }
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(title, margin, height - 7);
    doc.text(`${page} / ${pages}`, width - margin, height - 7, { align: "right" });
  }
  return doc.output("blob");
}