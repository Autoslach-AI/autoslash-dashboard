import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  Document, Packer, Paragraph, Table, TableRow,
  TableCell, TextRun, WidthType, AlignmentType,
  HeadingLevel
} from 'docx'
import { saveAs } from 'file-saver'

// ── Types ──────────────────────────────────────────────────────────────────

interface ProspectExport {
  name:                 string
  email:                string | null
  phone:                string | null
  package_type:         string | null
  template_title:       string | null
  budget:               number | null
  prospect_status:      string | null
  rappel_at:            string | null
  region:               string | null
  sector:               string | null
  internal_notes:       string | null
  created_at:           string
}

const HEADERS = [
  'NOM',
  'EMAIL',
  'TÉLÉPHONE',
  'PLAN',
  'TEMPLATE',
  'BUDGET (FCFA)',
  'STATUT',
  'DATE RAPPEL',
  'RÉGION',
  'SECTEUR',
  'COMMENTAIRE',
  'DATE INSCRIPTION'
]

function buildRows(prospects: ProspectExport[]): string[][] {
  return prospects.map(p => [
    p.name ?? '',
    p.email ?? '',
    p.phone ?? '',
    p.package_type ?? '',
    p.template_title ?? '',
    p.budget ? p.budget.toLocaleString('fr-FR') : '',
    p.prospect_status ?? '',
    p.rappel_at
      ? new Date(p.rappel_at).toLocaleDateString('fr-FR')
      : '',
    p.region ?? '',
    p.sector ?? '',
    p.internal_notes ?? '',
    new Date(p.created_at).toLocaleDateString('fr-FR')
  ])
}

// ── EXCEL ──────────────────────────────────────────────────────────────────

export function exportExcel(prospects: ProspectExport[], filename: string) {
  const rows  = buildRows(prospects)
  const wsData = [HEADERS, ...rows]
  const ws    = XLSX.utils.aoa_to_sheet(wsData)

  // Largeurs colonnes
  ws['!cols'] = [
    { wch: 22 }, // NOM
    { wch: 28 }, // EMAIL
    { wch: 18 }, // TÉLÉPHONE
    { wch: 12 }, // PLAN
    { wch: 22 }, // TEMPLATE
    { wch: 16 }, // BUDGET
    { wch: 12 }, // STATUT
    { wch: 14 }, // RAPPEL
    { wch: 14 }, // RÉGION
    { wch: 16 }, // SECTEUR
    { wch: 40 }, // COMMENTAIRE
    { wch: 16 }, // DATE
  ]

  // Style header
  HEADERS.forEach((_, i) => {
    const cell = XLSX.utils.encode_cell({ r: 0, c: i })
    if (!ws[cell]) return
    ws[cell].s = {
      font:      { bold: true, color: { rgb: 'FFFFFF' } },
      fill:      { fgColor: { rgb: '111111' } },
      alignment: { horizontal: 'center' }
    }
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Prospects')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

// ── PDF ────────────────────────────────────────────────────────────────────

export function exportPDF(prospects: ProspectExport[], filename: string) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  doc.setFontSize(16)
  doc.setTextColor(40, 40, 40)
  doc.text('PIPELINE PROSPECTS — AUTOSLASH AI', 14, 15)

  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(
    `Exporté le ${new Date().toLocaleDateString('fr-FR')} · ${prospects.length} prospects`,
    14, 22
  )

  const rows = buildRows(prospects)

  autoTable(doc, {
    head:       [HEADERS],
    body:       rows,
    startY:     28,
    styles: {
      fontSize:  8,
      cellPadding: 3,
      overflow:  'linebreak',
      textColor: [30, 30, 30]
    },
    headStyles: {
      fillColor:  [17, 17, 17],
      textColor:  [255, 255, 255],
      fontStyle:  'bold',
      fontSize:   8,
      halign:     'center'
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248]
    },
    columnStyles: {
      0:  { cellWidth: 22 },  // NOM
      1:  { cellWidth: 30 },  // EMAIL
      2:  { cellWidth: 20 },  // TÉLÉPHONE
      3:  { cellWidth: 16 },  // PLAN
      4:  { cellWidth: 24 },  // TEMPLATE
      5:  { cellWidth: 18 },  // BUDGET
      6:  { cellWidth: 14 },  // STATUT
      7:  { cellWidth: 16 },  // RAPPEL
      8:  { cellWidth: 16 },  // RÉGION
      9:  { cellWidth: 16 },  // SECTEUR
      10: { cellWidth: 40 },  // COMMENTAIRE
      11: { cellWidth: 18 },  // DATE
    },
    margin: { left: 10, right: 10 }
  })

  doc.save(`${filename}.pdf`)
}

// ── WORD ───────────────────────────────────────────────────────────────────

export async function exportWord(prospects: ProspectExport[], filename: string) {
  const rows = buildRows(prospects)

  const headerRow = new TableRow({
    children: HEADERS.map(h =>
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 18 })],
            alignment: AlignmentType.CENTER
          })
        ],
        shading: { fill: '111111' },
        width: { size: 10, type: WidthType.PERCENTAGE }
      })
    )
  })

  const dataRows = rows.map((row, idx) =>
    new TableRow({
      children: row.map(cell =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: cell, size: 16 })]
            })
          ],
          shading: { fill: idx % 2 === 0 ? 'FFFFFF' : 'F8F8F8' },
          width: { size: 10, type: WidthType.PERCENTAGE }
        })
      )
    })
  )

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          text: 'PIPELINE PROSPECTS — AUTOSLASH AI',
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Exporté le ${new Date().toLocaleDateString('fr-FR')} · ${prospects.length} prospects`,
              color: '888888',
              size: 18
            })
          ],
          spacing: { after: 400 }
        }),
        new Table({
          rows:  [headerRow, ...dataRows],
          width: { size: 100, type: WidthType.PERCENTAGE }
        })
      ]
    }]
  })

  const buffer = await Packer.toBuffer(doc)
  saveAs(new Blob([buffer]), `${filename}.docx`)
}
