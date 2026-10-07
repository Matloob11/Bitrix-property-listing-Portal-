/** Simple multi-page PDF for agent daily / monthly report. */

const PAGE_W = 595.28;
const PAGE_H = 841.89;

function esc(text) {
  return String(text ?? "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/–|—/g, "-")
    .replace(/[^\x20-\x7E]/g, "?")
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function t(x, y, size, value, bold = false) {
  const v = String(value ?? "").trim();
  if (!v) return "";
  const font = bold ? "/F2" : "/F1";
  return `q 0 w 0 Tr BT 0 Tc 0 Tw ${font} ${size.toFixed(1)} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${esc(v)}) Tj ET Q\n`;
}

function wrap(textValue, width) {
  const words = String(textValue || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const word of words) {
    const next = cur ? `${cur} ${word}` : word;
    if (next.length > width && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

function buildPages(report) {
  const pages = [];
  let ops = [];
  let y = 800;

  function flush() {
    pages.push(ops.join(""));
    ops = [];
    y = 800;
  }

  function line(text, { size = 10, bold = false, gap = 14, x = 48 } = {}) {
    for (const part of wrap(text, bold ? 70 : 85)) {
      if (y < 56) flush();
      ops.push(t(x, y, size, part, bold));
      y -= gap;
    }
  }

  const s = report.summary || {};
  const range = report.range || {};
  line("A7 Property Listing — Agent Daily Report", { size: 14, bold: true, gap: 20 });
  line(`Agent: ${report.agentName || report.agentId}`, { size: 11, bold: true });
  line(`Period: ${range.label || ""}  (${range.from || ""} → ${range.to || ""})`);
  line(`Generated: ${new Date(report.checkedAt || Date.now()).toISOString()}`);
  y -= 6;
  line("Summary", { size: 12, bold: true, gap: 16 });
  line(`Leads worked: ${s.leadsWorked ?? 0}`);
  line(`Leads not worked (idle): ${s.leadsNotWorked ?? 0}`);
  line(`Leads proceeded: ${s.leadsProceeded ?? 0}`);
  line(`Junk: ${s.leadsJunk ?? 0}`);
  line(`Meetings: ${s.meetings ?? 0}   Activities: ${s.activities ?? 0}`);
  line(`Leads shared out: ${s.sharedOut ?? 0} (worked ${s.sharedOutWorked ?? 0} / idle ${s.sharedOutIdle ?? 0})`);
  line(`Leads shared in: ${s.sharedIn ?? 0}   Idle alerts: ${s.idleAlerts ?? 0}`);

  const pushList = (title, rows, mapFn) => {
    y -= 8;
    line(title, { size: 12, bold: true, gap: 16 });
    const list = Array.isArray(rows) ? rows : [];
    if (!list.length) {
      line("None in this period.");
      return;
    }
    for (const row of list.slice(0, 80)) line(mapFn(row), { size: 9, gap: 12 });
    if (list.length > 80) line(`…and ${list.length - 80} more`);
  };

  pushList("Leads worked", report.leads?.worked, (r) => `#${r.id} ${r.title} · ${r.status}`);
  pushList("Leads not worked", report.leads?.notWorked, (r) => `#${r.id} ${r.title} · ${r.status}`);
  pushList("Leads proceeded", report.leads?.proceeded, (r) => `#${r.id} ${r.title} · ${r.status}`);
  pushList(
    "Shares out (this agent shared)",
    report.shares?.sharedOut,
    (r) => `#${r.leadId} → ${r.sharedToName} @ ${r.sharedAt} · ${r.workLabel}`
  );
  pushList(
    "Shares in (shared with this agent)",
    report.shares?.sharedIn,
    (r) => `#${r.leadId} from ${r.sharedByName} @ ${r.sharedAt} · ${r.workLabel}`
  );
  pushList(
    "Activities",
    report.activities?.rows,
    (r) => `${r.created} · ${r.subject} · lead #${r.leadId || "—"}`
  );

  if (report.shares?.error) {
    y -= 8;
    line(`Share note: ${report.shares.error}`, { size: 9 });
  }

  flush();
  return pages;
}

function assemblePdf(pageContents) {
  const objects = [];
  objects.push({ head: "<< /Type /Catalog /Pages 2 0 R >>" }); // 1
  const kids = pageContents.map((_, i) => `${3 + i * 2} 0 R`).join(" ");
  objects.push({ head: `<< /Type /Pages /Kids [${kids}] /Count ${pageContents.length} >>` }); // 2

  const fontStart = 3 + pageContents.length * 2;
  for (let i = 0; i < pageContents.length; i++) {
    const contentId = 4 + i * 2;
    const pageId = 3 + i * 2;
    objects.push({
      head: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontStart} 0 R /F2 ${fontStart + 1} 0 R >> >> >>`,
    });
    const stream = Buffer.from(pageContents[i], "latin1");
    objects.push({
      head: `<< /Length ${stream.length} >>`,
      stream,
    });
  }
  objects.push({ head: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>" });
  objects.push({ head: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>" });

  // Fix object numbering: catalog=1 pages=2 then alternating page/content, then fonts
  // Rebuild properly
  const objs = [];
  objs[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  const pageRefs = [];
  let nextId = 3;
  const contentStreams = [];
  for (const content of pageContents) {
    const pageId = nextId++;
    const contentId = nextId++;
    pageRefs.push(pageId);
    contentStreams.push({ pageId, contentId, content });
  }
  const f1 = nextId++;
  const f2 = nextId++;
  objs[2] = `<< /Type /Pages /Kids [${pageRefs.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`;
  for (const item of contentStreams) {
    objs[item.pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Contents ${item.contentId} 0 R /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> >>`;
    const stream = Buffer.from(item.content, "latin1");
    objs[item.contentId] = { head: `<< /Length ${stream.length} >>`, stream };
  }
  objs[f1] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objs[f2] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

  const chunks = [Buffer.from("%PDF-1.4\n", "latin1")];
  const offsets = [0];
  let length = chunks[0].length;
  for (let id = 1; id < objs.length; id++) {
    offsets[id] = length;
    const object = objs[id];
    let body;
    if (typeof object === "string") {
      body = Buffer.from(`${id} 0 obj\n${object}\nendobj\n`, "latin1");
    } else {
      body = Buffer.concat([
        Buffer.from(`${id} 0 obj\n${object.head}\nstream\n`, "latin1"),
        object.stream,
        Buffer.from("\nendstream\nendobj\n", "latin1"),
      ]);
    }
    chunks.push(body);
    length += body.length;
  }
  const xrefOffset = length;
  let xref = `xref\n0 ${objs.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objs.length; id++) {
    xref += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer << /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  chunks.push(Buffer.from(xref, "latin1"));
  return Buffer.concat(chunks);
}

export function agentDailyReportPdf(report) {
  return assemblePdf(buildPages(report || {}));
}

export function agentDailyReportPdfName(report) {
  const agent = String(report?.agentName || report?.agentId || "agent")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const label = String(report?.range?.label || "report").replace(/[^a-zA-Z0-9-]+/g, "_");
  return `agent-report-${agent}-${label}.pdf`;
}
