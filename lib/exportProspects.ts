import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  Document, Packer, Paragraph, Table, TableRow,
  TableCell, TextRun, WidthType, AlignmentType,
  HeadingLevel, ShadingType
} from 'docx'
import { saveAs } from 'file-saver'

interface ProspectExport {
  name:                 string
  email:                string | null
  phone:                string | null
  package_type:         string | null
  template_title:       string | null
  template_preview_url: string | null
  budget:               number | null
  budget_source:        string | null
  prospect_status:      string | null
  rappel_at:            string | null
  region:               string | null
  sector:               string | null
  internal_notes:       string | null
  message:              string | null
  created_at:           string
}

const HEADERS = [
  'NOM',
  'EMAIL',
  'TÉLÉPHONE',
  'PLAN',
  'TEMPLATE',
  'LIEN PREVIEW',
  'BUDGET (FCFA)',
  'STATUT',
  'DATE RAPPEL',
  'RÉGION',
  'SECTEUR',
  'MESSAGE CLIENT',
  'COMMENTAIRE',
  'DATE INSCRIPTION'
]

function formatBudget(val: number | null): string {
  if (!val || val === 0) return ''
  // Format sans séparateur de milliers problématique
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

function buildRows(prospects: ProspectExport[]): string[][] {
  return prospects.map(p => [
    p.name                  ?? '',
    p.email                 ?? '',
    p.phone                 ?? '',
    p.package_type          ?? '',
    p.template_title        ?? '',
    p.template_preview_url  ?? '',
    formatBudget(p.budget),
    p.prospect_status       ?? '',
    p.rappel_at
      ? new Date(p.rappel_at).toLocaleDateString('fr-FR')
      : '',
    p.region                ?? '',
    p.sector                ?? '',
    // Nettoyer le message (supprimer les prompts vidéo parasites)
    (p.message ?? '').length > 300
      ? (p.message ?? '').substring(0, 300) + '...'
      : (p.message ?? ''),
    p.internal_notes        ?? '',
    new Date(p.created_at).toLocaleDateString('fr-FR')
  ])
}

// ── EXCEL ─────────────────────────────────────────────────────────────────

export function exportExcel(
  prospects: ProspectExport[],
  filename: string
) {
  const rows   = buildRows(prospects)
  const wsData = [HEADERS, ...rows]
  const ws     = XLSX.utils.aoa_to_sheet(wsData)

  ws['!cols'] = [
    { wch: 22 },  // NOM
    { wch: 28 },  // EMAIL
    { wch: 20 },  // TÉLÉPHONE
    { wch: 12 },  // PLAN
    { wch: 24 },  // TEMPLATE
    { wch: 42 },  // LIEN PREVIEW
    { wch: 16 },  // BUDGET
    { wch: 12 },  // STATUT
    { wch: 14 },  // RAPPEL
    { wch: 14 },  // RÉGION
    { wch: 16 },  // SECTEUR
    { wch: 50 },  // MESSAGE
    { wch: 40 },  // COMMENTAIRE
    { wch: 16 },  // DATE
  ]

  // Hauteur row header
  ws['!rows'] = [{ hpt: 20 }]

  // Freeze première ligne
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Prospects')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

// ── PDF ───────────────────────────────────────────────────────────────────

export function exportPDF(
  prospects: ProspectExport[],
  filename: string
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit:        'mm',
    format:      'a3'   // A3 pour avoir plus de largeur
  })

  // Titre
  doc.setFontSize(18)
  doc.setTextColor(20, 20, 20)
  doc.text('PIPELINE PROSPECTS — AUTOSLASH AI', 14, 16)

  // Sous-titre
  doc.setFontSize(10)
  doc.setTextColor(130, 130, 130)
  doc.text(
    `Exporté le ${new Date().toLocaleDateString('fr-FR')} · ${prospects.length} prospects`,
    14, 24
  )

  const rows = buildRows(prospects)

  // Colonnes PDF — on retire LIEN PREVIEW (trop long pour PDF)
  // et on tronque MESSAGE à 80 chars
  const pdfHeaders = [
    'NOM', 'EMAIL', 'TÉLÉPHONE', 'PLAN', 'TEMPLATE',
    'BUDGET', 'STATUT', 'RAPPEL', 'RÉGION',
    'SECTEUR', 'MESSAGE', 'COMMENTAIRE', 'DATE'
  ]

  const pdfRows = prospects.map(p => [
    p.name                 ?? '',
    p.email                ?? '',
    p.phone                ?? '',
    p.package_type         ?? '',
    p.template_title       ?? '',
    formatBudget(p.budget),
    p.prospect_status      ?? '',
    p.rappel_at ? new Date(p.rappel_at).toLocaleDateString('fr-FR') : '',
    p.region               ?? '',
    p.sector               ?? '',
    (p.message ?? '').substring(0, 80) + ((p.message ?? '').length > 80 ? '...' : ''),
    p.internal_notes       ?? '',
    new Date(p.created_at).toLocaleDateString('fr-FR')
  ])

  autoTable(doc, {
    head:   [pdfHeaders],
    body:   pdfRows,
    startY: 30,
    styles: {
      fontSize:    7.5,
      cellPadding: 3,
      overflow:    'linebreak',
      textColor:   [30, 30, 30],
      lineColor:   [220, 220, 220],
      lineWidth:   0.2,
    },
    headStyles: {
      fillColor:  [17, 17, 17],
      textColor:  [255, 255, 255],
      fontStyle:  'bold',
      fontSize:   7.5,
      halign:     'center',
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    columnStyles: {
      0:  { cellWidth: 22, fontStyle: 'bold' }, // NOM
      1:  { cellWidth: 34 },                    // EMAIL
      2:  { cellWidth: 24 },                    // TÉLÉPHONE
      3:  { cellWidth: 18 },                    // PLAN
      4:  { cellWidth: 26 },                    // TEMPLATE
      5:  { cellWidth: 20, halign: 'right' },   // BUDGET
      6:  { cellWidth: 16 },                    // STATUT
      7:  { cellWidth: 18 },                    // RAPPEL
      8:  { cellWidth: 18 },                    // RÉGION
      9:  { cellWidth: 18 },                    // SECTEUR
      10: { cellWidth: 50 },                    // MESSAGE
      11: { cellWidth: 38 },                    // COMMENTAIRE
      12: { cellWidth: 18 },                    // DATE
    },
    margin:       { left: 10, right: 10, top: 10 },
    didParseCell: (data) => {
      // Coloriser STATUT
      if (data.section === 'body' && data.column.index === 6) {
        const val = String(data.cell.raw ?? '')
        if (val === 'CONVERTI') {
          data.cell.styles.textColor = [30, 200, 30]
          data.cell.styles.fontStyle = 'bold'
        } else if (val === 'ANNULÉ') {
          data.cell.styles.textColor = [160, 160, 160]
        } else if (val === 'RAPPELER') {
          data.cell.styles.textColor = [230, 120, 30]
          data.cell.styles.fontStyle = 'bold'
        }
      }
    }
  })

  // Pagination
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(180, 180, 180)
    doc.text(
      `Page ${i} / ${pageCount} — Autoslash AI`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    )
  }

  doc.save(`${filename}.pdf`)
}

// ── WORD ──────────────────────────────────────────────────────────────────

export async function exportWord(
  prospects: ProspectExport[],
  filename: string
) {
  const makeBorderStyle = () => ({
    style: 'single' as const,
    size:  4,
    color: 'E0E0E0'
  })

  const makeCell = (
    text: string,
    opts: {
      bold?:    boolean
      bg?:      string
      color?:   string
      width?:   number
      center?:  boolean
    } = {}
  ) =>
    new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text:  text ?? '',
              bold:  opts.bold  ?? false,
              color: opts.color ?? '1A1A1A',
              size:  opts.bold ? 18 : 16,
            })
          ],
          alignment: opts.center
            ? AlignmentType.CENTER
            : AlignmentType.LEFT,
          spacing: { before: 40, after: 40 }
        })
      ],
      shading: opts.bg
        ? { type: ShadingType.SOLID, fill: opts.bg }
        : undefined,
      borders: {
        top:    makeBorderStyle(),
        bottom: makeBorderStyle(),
        left:   makeBorderStyle(),
        right:  makeBorderStyle(),
      },
      width: opts.width
        ? { size: opts.width, type: WidthType.DXA }
        : undefined,
      margins: {
        top: 80, bottom: 80, left: 120, right: 120
      }
    })

  const headerRow = new TableRow({
    tableHeader: true,
    children: HEADERS.map(h =>
      makeCell(h, { bold: true, bg: '111111', color: 'FFFFFF', center: true })
    )
  })

  const dataRows = prospects.map((p, idx) => {
    const row = buildRows([p])[0]
    const bg  = idx % 2 === 0 ? 'FFFFFF' : 'F5F5F5'
    return new TableRow({
      children: row.map((cell, i) => makeCell(cell, { bg }))
    })
  })

  const doc = new Document({
    styles: {
      paragraphStyles: [{
        id:   'Normal',
        name: 'Normal',
        run:  { font: 'Calibri' }
      }]
    },
    sections: [{
      properties: {
        page: {
          size: {
            orientation: 'landscape' as const,
            width:       16838,
            height:      11906
          },
          margin: {
            top: 720, bottom: 720,
            left: 720, right: 720
          }
        }
      },
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text:  'PIPELINE PROSPECTS — AUTOSLASH AI',
              bold:  true,
              size:  36,
              color: '111111'
            })
          ],
          spacing: { after: 160 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text:  `Exporté le ${new Date().toLocaleDateString('fr-FR')} · ${prospects.length} prospects`,
              size:  20,
              color: '888888'
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
