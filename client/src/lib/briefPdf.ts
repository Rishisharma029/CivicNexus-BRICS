import { jsPDF } from "jspdf";

export type ExportablePolicyBrief = { title: string; content: string };

export function exportBriefPdf(brief: ExportablePolicyBrief) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const cleanText = brief.content.replace(/^#{1,6}\s?/gm, "").replace(/\*\*/g, "");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text(brief.title, 48, 58, { maxWidth: 500 });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(80);
  pdf.text("CivicNexus BRICS · AI-assisted, human-review required", 48, 86);
  pdf.setFontSize(11);
  pdf.setTextColor(20);
  const lines = pdf.splitTextToSize(cleanText, 500);
  let y = 116;
  lines.forEach((line: string) => {
    if (y > 790) { pdf.addPage(); y = 54; }
    pdf.text(line, 48, y);
    y += 16;
  });
  pdf.save(`${brief.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}.pdf`);
}
