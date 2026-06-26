import { jsPDF }   from 'jspdf';
import autoTable   from 'jspdf-autotable';
import {
  filterFacts, aggregateByMonth, aggregateByDepartment,
  aggregateByProvider, computeKPIs,
} from '../data/mockData';

const C = {
  blue:      [30,  58,  95],    // #1e3a5f - header, accent
  black:     [17,  24,  39],
  dark:      [55,  65,  81],
  gray:      [107, 114, 128],
  lightgray: [209, 213, 219],
  headFill:  [243, 244, 246],
  zebra:     [249, 250, 251],
  white:     [255, 255, 255],
  blueFill:  [235, 241, 250],   // total row background
  red:       [220,  38,  38],
  green:     [ 22, 163,  74],
  orange:    [217, 119,   6],
};

const PAGE_W = 210;
const PAGE_H = 297;
const M      = 18;
const CW     = PAGE_W - M * 2;

function drawSectionTitle(doc, label, y) {
  doc.setFillColor(...C.blue);
  doc.rect(M, y - 4, 3, 9, 'F');
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.blue);
  doc.text(label, M + 6, y);
  return y + 11;
}

function stampFooters(doc) {
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    const fy = PAGE_H - 10;
    doc.setDrawColor(...C.lightgray);
    doc.setLineWidth(0.4);
    doc.line(M, fy - 5, PAGE_W - M, fy - 5);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.gray);
    doc.text('Platforma FinOps RO - Lucrare de licenta 2026', M, fy);
    doc.text(`Pagina ${p} din ${total}`, PAGE_W - M, fy, { align: 'right' });
  }
}

export function generatePdfReport() {

  // ─── Date (calcule nemodificate) ─────────────────────────────────
  const facts25    = filterFacts({ year: '2025' });
  const facts24    = filterFacts({ year: '2024' });
  const kpis       = computeKPIs(facts25, facts24);
  const luni       = aggregateByMonth(facts25, '2025');
  const dept25     = aggregateByDepartment(facts25);
  const dept24     = aggregateByDepartment(facts24);
  const provs      = aggregateByProvider(facts25);
  const BUGET_L    = 33000;
  const overBudget = luni.filter(l => l.netCost > BUGET_L);
  const total24    = Math.round(facts24.reduce((s, f) => s + f.net_cost, 0));
  const today      = new Date().toLocaleDateString('ro-RO', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  // ─── Rezumat trimestrial ─────────────────────────────────────────
  const quarterLabels = [
    'T1 (Ian-Mar)', 'T2 (Apr-Iun)', 'T3 (Iul-Sep)', 'T4 (Oct-Dec)',
  ];
  const quarterData = [0, 1, 2, 3].map((q, qi) => {
    const months  = luni.slice(q * 3, q * 3 + 3);
    const avgCost = Math.round(months.reduce((s, m) => s + m.netCost, 0) / 3);
    const peak    = months.reduce((a, b) => b.netCost > a.netCost ? b : a);
    const deviation = avgCost - BUGET_L;
    return {
      label:      quarterLabels[qi],
      avgCost,
      peakMonth:  peak.fullName,
      peakCost:   peak.netCost,
      deviation,
      overBudget: avgCost > BUGET_L,
    };
  });

  // ─── Status dinamic departamente ────────────────────────────────
  const variatiiDept = dept25.map((d, i) => {
    const prev = dept24[i]?.netCost ?? 0;
    return prev > 0 ? parseFloat((((d.netCost - prev) / prev) * 100).toFixed(1)) : 0;
  });
  const maxVar = Math.max(...variatiiDept);
  const avgVar = variatiiDept.reduce((s, v) => s + v, 0) / variatiiDept.length;
  const getStatus = (v) =>
    v === maxVar ? 'CRITIC' : v > avgVar ? 'AVERTISMENT' : 'ACCEPTABIL';

  // ─── Document ───────────────────────────────────────────────────
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  // ══ ANTET full-width albastru ════════════════════════════════════
  doc.setFillColor(...C.blue);
  doc.rect(0, 0, PAGE_W, 38, 'F');

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.white);
  doc.text('RAPORT FINOPS RO', M, 17);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data generarii: ${today}`, PAGE_W - M, 17, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(180, 205, 235);
  doc.text('Document Confidential - Uz intern', M, 28);
  doc.text('Exercitiul financiar 2025', PAGE_W - M, 28, { align: 'right' });

  let y = 50;

  // ══ SECTIUNEA 1: KPI 2x2 ════════════════════════════════════════
  y = drawSectionTitle(doc, '1. Rezumat executiv', y);

  const kpiList = [
    {
      label: 'COST TOTAL NET 2025',
      value: `${kpis.totalNet.toLocaleString('ro-RO')} RON`,
      sub:   `${kpis.deltaVsPrev >= 0 ? '+' : ''}${kpis.deltaVsPrev}% fata de 2024`,
      subC:  kpis.deltaVsPrev > 0 ? C.red : C.green,
    },
    {
      label: kpis.bugetDepasit ? 'BUGET DEPASIT' : 'BUGET RAMAS',
      value: `${kpis.bugetRamas.toLocaleString('ro-RO')} RON`,
      sub:   overBudget.length > 0
        ? `${overBudget.length} luni au depasit limita`
        : 'Nicio luna depasita',
      subC:  overBudget.length > 0 ? C.red : C.green,
    },
    {
      label: 'ECONOMII DISCOUNTURI',
      value: `${kpis.totalDiscount.toLocaleString('ro-RO')} RON`,
      sub:   `${kpis.discountPct}% reducere din cost brut`,
      subC:  C.green,
    },
    {
      label: 'MEDIE LUNARA',
      value: `${kpis.avgPerMonth.toLocaleString('ro-RO')} RON`,
      sub:   `${kpis.activeServices} servicii active`,
      subC:  C.gray,
    },
  ];

  const boxW   = CW / 2;
  const boxH   = 28;
  const boxGap = 3;

  kpiList.forEach((k, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const bx  = M + col * boxW;
    const by  = y + row * (boxH + boxGap);

    doc.setFillColor(...C.white);
    doc.setDrawColor(...C.lightgray);
    doc.setLineWidth(0.35);
    doc.rect(bx, by, boxW, boxH, 'FD');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.gray);
    doc.text(k.label, bx + 5, by + 8);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.black);
    doc.text(k.value, bx + 5, by + 18);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...k.subC);
    doc.text(k.sub, bx + 5, by + 24.5);
  });

  y += 2 * (boxH + boxGap) + 10;

  // ══ SECTIUNEA 2: REZUMAT TRIMESTRIAL ════════════════════════════
  y = drawSectionTitle(doc, '2. Evolutie bugetara trimestriala', y);

  // header tabel manual
  const qColW = [42, 40, 50, 42];
  const qHead = ['Trimestru', 'Cost mediu lunar', 'Deviere fata de buget', 'Luna de varf'];

  doc.setFillColor(...C.headFill);
  doc.setDrawColor(...C.lightgray);
  doc.setLineWidth(0.2);
  doc.rect(M, y, CW, 7.5, 'FD');

  let qx = M;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.dark);
  qHead.forEach((h, i) => {
    doc.text(h, qx + 3, y + 5);
    qx += qColW[i];
  });
  y += 7.5;

  quarterData.forEach((q, qi) => {
    doc.setFillColor(...(qi % 2 === 0 ? C.white : C.zebra));
    doc.setDrawColor(...C.lightgray);
    doc.setLineWidth(0.2);
    doc.rect(M, y, CW, 8, 'FD');

    qx = M;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.dark);
    doc.text(q.label, qx + 3, y + 5.2);
    qx += qColW[0];

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.black);
    doc.text(`${q.avgCost.toLocaleString('ro-RO')} RON`, qx + 3, y + 5.2);
    qx += qColW[1];

    const devSign = q.deviation > 0 ? '+' : '';
    doc.setTextColor(...(q.overBudget ? C.red : C.green));
    doc.setFont('helvetica', 'bold');
    doc.text(`${devSign}${q.deviation.toLocaleString('ro-RO')} RON`, qx + 3, y + 5.2);
    qx += qColW[2];

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.dark);
    doc.text(`${q.peakMonth.replace(/Junie/g, 'Iunie')}`, qx + 3, y + 3.5);
    doc.setFontSize(7);
    doc.setTextColor(...C.gray);
    doc.text(`${q.peakCost.toLocaleString('ro-RO')} RON`, qx + 3, y + 7);
    y += 8;
  });

  y += 10;

  // ══ SECTIUNEA 3: TABEL DEPARTAMENTE ═════════════════════════════
  y = drawSectionTitle(doc, '3. Distributie pe departamente', y);

  const totalNet25  = Math.round(dept25.reduce((s, d) => s + d.netCost, 0));
  const totalNet24  = Math.round(dept24.reduce((s, d) => s + d.netCost, 0));
  const totalVarPct = totalNet24 > 0
    ? parseFloat((((totalNet25 - totalNet24) / totalNet24) * 100).toFixed(1))
    : 0;

  const tableRows = dept25.map((d, i) => {
    const prev     = dept24[i]?.netCost ?? 0;
    const variatie = variatiiDept[i];
    const pondere  = Math.round((d.netCost / kpis.totalNet) * 100);
    return [
      d.name,
      `${d.netCost.toLocaleString('ro-RO')} RON`,
      `${prev.toLocaleString('ro-RO')} RON`,
      `${variatie > 0 ? '+' : ''}${variatie}%`,
      `${pondere}%`,
      getStatus(variatie),
    ];
  });

  const footRow = [
    'TOTAL GENERAL',
    `${totalNet25.toLocaleString('ro-RO')} RON`,
    `${totalNet24.toLocaleString('ro-RO')} RON`,
    `${totalVarPct > 0 ? '+' : ''}${totalVarPct}%`,
    '100%',
    '',
  ];

  autoTable(doc, {
    startY: y,
    head:   [['Departament', 'Cost 2025', 'Cost 2024', 'Variatie', 'Pondere', 'Status']],
    body:   tableRows,
    foot:   [footRow],
    margin:     { left: M, right: M },
    tableWidth: CW,
    styles: { fontSize: 8, textColor: [15, 23, 42], cellPadding: 3, font: 'helvetica' },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    bodyStyles:         { fillColor: C.white },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 28, halign: 'right' },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 30, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section !== 'body') return;

      if (data.column.index === 5) {
        const val = data.cell.raw;
        if (val === 'CRITIC') {
          data.cell.styles.textColor = C.red;
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'AVERTISMENT') {
          data.cell.styles.textColor = C.orange;
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = C.green;
        }
      }
    },
  });

  stampFooters(doc);
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`raport-finops-ro-2025-${dateStr}.pdf`);
}
