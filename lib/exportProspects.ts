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
  enterprise_id:        string
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

const EXCEL_HEADERS = [
  'ID ENTREPRISE',
  'NOM',
  'EMAIL',
  'TÉLÉPHONE',
  'PLAN',
  'TEMPLATE',
  'LIEN PREVIEW',
  'BUDGET (FCFA)',
  'STATUT',
  'RÉGION',
  'SECTEUR',
  'MESSAGE CLIENT',
  'COMMENTAIRE',
  'DATE INSCRIPTION'
]

function buildExcelRows(prospects: ProspectExport[]): (string | number)[][] {
  return prospects.map(p => [
    p.enterprise_id                ?? '',
    p.name                         ?? '',
    p.email                        ?? '',
    p.phone                        ?? '',
    p.package_type                 ?? '',
    p.template_title               ?? '',
    p.template_preview_url         ?? '',
    p.budget ?? '',
    p.prospect_status              ?? '',
    p.region                       ?? '',
    p.sector                       ?? '',
    p.message                      ?? '',
    p.internal_notes               ?? '',
    new Date(p.created_at).toLocaleDateString('fr-FR')
  ])
}

export function exportExcel(
  prospects: ProspectExport[],
  filename: string
) {
  const rows   = buildExcelRows(prospects)
  const wsData = [EXCEL_HEADERS, ...rows]
  const ws     = XLSX.utils.aoa_to_sheet(wsData)

  // Largeurs colonnes
  ws['!cols'] = [
    { wch: 38 },  // ID ENTREPRISE
    { wch: 22 },  // NOM
    { wch: 30 },  // EMAIL
    { wch: 22 },  // TÉLÉPHONE
    { wch: 14 },  // PLAN
    { wch: 26 },  // TEMPLATE
    { wch: 45 },  // LIEN PREVIEW
    { wch: 18 },  // BUDGET
    { wch: 14 },  // STATUT
    { wch: 16 },  // RÉGION
    { wch: 18 },  // SECTEUR
    { wch: 60 },  // MESSAGE CLIENT
    { wch: 50 },  // COMMENTAIRE
    { wch: 18 },  // DATE
  ]

  // Hauteur header
  if (!ws['!rows']) ws['!rows'] = []
  ws['!rows'][0] = { hpt: 22 }

  // Style header : fond noir, texte blanc, gras, centré
  EXCEL_HEADERS.forEach((_, i) => {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: i })
    if (!ws[cellRef]) return
    ws[cellRef].s = {
      font:      { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
      fill:      { patternType: 'solid', fgColor: { rgb: '111111' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        bottom: { style: 'medium', color: { rgb: '39FF14' } }
      }
    }
  })

  // Style données : wrap text sur MESSAGE et COMMENTAIRE
  for (let r = 1; r <= rows.length; r++) {
    // Alternance couleur de fond
    const bg = r % 2 === 0 ? 'F5F5F5' : 'FFFFFF'
    EXCEL_HEADERS.forEach((_, c) => {
      const cellRef = XLSX.utils.encode_cell({ r, c })
      if (!ws[cellRef]) return
      ws[cellRef].s = {
        fill:      { patternType: 'solid', fgColor: { rgb: bg } },
        alignment: {
          vertical:  'top',
          wrapText:  c === 11 || c === 12  // MESSAGE et COMMENTAIRE
        },
        font: {
          bold:  c === 1, // NOM en gras
          color: { rgb: c === 7 ? '229922' : '1A1A1A' } // BUDGET en vert
        }
      }
    })
    // Hauteur lignes données
    ws['!rows'][r] = { hpt: 40 }
  }

  // Freeze première ligne
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }

  // Auto-filter sur toutes les colonnes
  ws['!autofilter'] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: rows.length, c: EXCEL_HEADERS.length - 1 }
    })
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Prospects')

  // Propriétés du classeur
  wb.Props = {
    Title:   'Pipeline Prospects',
    Author:  'Autoslash AI',
    Company: 'Autoslash AI'
  }

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
    format:      'a3'
  })

  // ─── PAGE 1 : TABLEAU SYNTHÈSE (sans message) ───────────────────────────

  doc.setFontSize(20)
  doc.setTextColor(20, 20, 20)
  doc.text('PIPELINE PROSPECTS — AUTOSLASH AI', 14, 16)

  doc.setFontSize(10)
  doc.setTextColor(130, 130, 130)
  doc.text(
    `Exporté le ${new Date().toLocaleDateString('fr-FR')} · ${prospects.length} prospects`,
    14, 24
  )

  // Tableau synthèse — sans colonne MESSAGE
  const synthHeaders = [
    'ID', 'NOM', 'EMAIL', 'TÉLÉPHONE',
    'PLAN', 'TEMPLATE', 'BUDGET (FCFA)',
    'STATUT', 'RÉGION', 'SECTEUR',
    'COMMENTAIRE', 'DATE'
  ]

  const synthRows = prospects.map(p => [
    p.enterprise_id ? p.enterprise_id.substring(0, 8) + '...' : '',
    p.name                 ?? '',
    p.email                ?? '',
    p.phone                ?? '',
    p.package_type         ?? '',
    p.template_title       ?? '',
    formatBudget(p.budget),
    p.prospect_status      ?? '',
    p.region               ?? '',
    p.sector               ?? '',
    p.internal_notes       ?? '',
    new Date(p.created_at).toLocaleDateString('fr-FR')
  ])

  autoTable(doc, {
    head:   [synthHeaders],
    body:   synthRows,
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
      fillColor:   [17, 17, 17],
      textColor:   [255, 255, 255],
      fontStyle:   'bold',
      fontSize:    8,
      halign:      'center',
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    columnStyles: {
      0:  { cellWidth: 22 },  // ID
      1:  { cellWidth: 26, fontStyle: 'bold' }, // NOM
      2:  { cellWidth: 36 },  // EMAIL
      3:  { cellWidth: 26 },  // TÉLÉPHONE
      4:  { cellWidth: 20 },  // PLAN
      5:  { cellWidth: 28 },  // TEMPLATE
      6:  { cellWidth: 22, halign: 'right' }, // BUDGET
      7:  { cellWidth: 18 },  // STATUT
      8:  { cellWidth: 20 },  // RÉGION
      9:  { cellWidth: 20 },  // SECTEUR
      10: { cellWidth: 40 },  // COMMENTAIRE
      11: { cellWidth: 18 },  // DATE
    },
    margin: { left: 10, right: 10, top: 10 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 7) {
        const val = String(data.cell.raw ?? '')
        if (val === 'CONVERTI') {
          data.cell.styles.textColor = [30, 180, 30]
          data.cell.styles.fontStyle = 'bold'
        } else if (val === 'ANNULÉ') {
          data.cell.styles.textColor = [160, 160, 160]
        } else if (val === 'RAPPELER') {
          data.cell.styles.textColor = [220, 110, 20]
          data.cell.styles.fontStyle = 'bold'
        }
      }
    }
  })

  // ─── PAGES SUIVANTES : FICHES DÉTAIL (avec message complet) ─────────────

  prospects.forEach((p, idx) => {
    doc.addPage()

    const pageW = doc.internal.pageSize.getWidth()
    const margin = 14
    let y = 16

    // ── En-tête fiche ──
    doc.setFillColor(17, 17, 17)
    doc.roundedRect(margin, y - 6, pageW - margin * 2, 20, 3, 3, 'F')

    doc.setFontSize(14)
    doc.setTextColor(255, 255, 255)
    doc.text(
      `${String(idx + 1).padStart(2, '0')}. ${p.name.toUpperCase()}`,
      margin + 6, y + 6
    )

    // Badge plan
    const planColors: Record<string, number[]> = {
      STARTUP:    [80, 80, 80],
      BUSINESS:   [30, 100, 200],
      ENTERPRISE: [120, 50, 200],
      ELITE:      [180, 140, 20]
    }
    const planColor = planColors[p.package_type ?? ''] ?? [80, 80, 80]
    doc.setFillColor(planColor[0], planColor[1], planColor[2])
    doc.roundedRect(pageW - margin - 38, y - 2, 36, 10, 2, 2, 'F')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text(p.package_type ?? '', pageW - margin - 20, y + 5, { align: 'center' })

    y += 22

    // ── Grille infos ──
    const col1X = margin
    const col2X = margin + 95
    const col3X = margin + 190

    const infoItems = [
      { label: 'EMAIL',        value: p.email               ?? '—' },
      { label: 'TÉLÉPHONE',    value: p.phone               ?? '—' },
      { label: 'RÉGION',       value: p.region              ?? '—' },
      { label: 'SECTEUR',      value: p.sector              ?? '—' },
      { label: 'STATUT',       value: p.prospect_status     ?? '—' },
      { label: 'BUDGET',       value: formatBudget(p.budget) || '—' },
      { label: 'TEMPLATE',     value: p.template_title      ?? '—' },
      { label: 'DATE',         value: new Date(p.created_at).toLocaleDateString('fr-FR') },
      { label: 'ID',           value: p.enterprise_id       ?? '—' },
    ]

    const colPositions = [col1X, col2X, col3X]
    infoItems.forEach((item, i) => {
      const x = colPositions[i % 3]
      const rowY = y + Math.floor(i / 3) * 14

      doc.setFontSize(7)
      doc.setTextColor(150, 150, 150)
      doc.text(item.label, x, rowY)

      doc.setFontSize(9)
      doc.setTextColor(20, 20, 20)
      const displayValue = item.value.length > 40
        ? item.value.substring(0, 40) + '...'
        : item.value
      doc.text(displayValue, x, rowY + 5)
    })

    y += Math.ceil(infoItems.length / 3) * 14 + 6

    // Lien preview si existe
    if (p.template_preview_url) {
      doc.setFontSize(8)
      doc.setTextColor(40, 160, 40)
      doc.text(`🔗 ${p.template_preview_url}`, margin, y)
      y += 10
    }

    // Séparateur
    doc.setDrawColor(220, 220, 220)
    doc.line(margin, y, pageW - margin, y)
    y += 8

    // ── Message client complet ──
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text('MESSAGE CLIENT', margin, y)
    y += 6

    doc.setFillColor(248, 248, 248)
    const msgBoxHeight = Math.min(
      (p.message ?? '').length > 0 ? 60 : 14,
      80
    )
    doc.roundedRect(margin, y, pageW - margin * 2, msgBoxHeight, 2, 2, 'F')

    if (p.message) {
      doc.setFontSize(9)
      doc.setTextColor(40, 40, 40)
      const lines = doc.splitTextToSize(
        p.message,
        pageW - margin * 2 - 8
      )
      // Afficher toutes les lignes dans la box
      const maxLines = Math.floor(msgBoxHeight / 5)
      const displayLines = lines.slice(0, maxLines)
      doc.text(displayLines, margin + 4, y + 6)

      // Si message tronqué → indiquer suite sur fond coloré
      if (lines.length > maxLines) {
        doc.setFontSize(7)
        doc.setTextColor(150, 150, 150)
        doc.text(
          `... message complet dans l'export Word ou Excel`,
          margin + 4,
          y + msgBoxHeight - 3
        )
      }
    } else {
      doc.setFontSize(9)
      doc.setTextColor(180, 180, 180)
      doc.text('Aucun message', margin + 4, y + 8)
    }

    y += msgBoxHeight + 8

    // ── Commentaire interne ──
    if (p.internal_notes) {
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text('COMMENTAIRE AMADOU', margin, y)
      y += 6

      doc.setFillColor(255, 252, 230)
      const noteLines  = doc.splitTextToSize(p.internal_notes, pageW - margin * 2 - 8)
      const noteHeight = Math.min(noteLines.length * 5 + 8, 40)
      doc.roundedRect(margin, y, pageW - margin * 2, noteHeight, 2, 2, 'F')

      doc.setFontSize(9)
      doc.setTextColor(40, 40, 40)
      doc.text(noteLines.slice(0, 6), margin + 4, y + 6)
    }
  })

  // ─── PAGINATION GLOBALE ──────────────────────────────────────────────────
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(180, 180, 180)
    const label = i === 1
      ? `Synthèse — Page 1 / ${pageCount} — Autoslash AI`
      : `Fiche prospect ${i - 1} / ${prospects.length} — Page ${i} / ${pageCount} — Autoslash AI`
    doc.text(
      label,
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
  const borderStyle = {
    style: 'single' as const,
    size:  4,
    color: 'DDDDDD'
  }

  const allBorders = {
    top:    borderStyle,
    bottom: borderStyle,
    left:   borderStyle,
    right:  borderStyle,
  }

  // ── Cellule header tableau ──
  const makeHeaderCell = (text: string, widthDXA: number) =>
    new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text,
              bold:  true,
              size:  18,
              color: '1A1A1A'
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing:   { before: 80, after: 80 }
        })
      ],
      shading:  { type: ShadingType.CLEAR, fill: 'EEEEEE' },
      borders:  allBorders,
      width:    { size: widthDXA, type: WidthType.DXA },
      margins:  { top: 120, bottom: 120, left: 160, right: 160 }
    })

  // ── Cellule données tableau ──
  const makeDataCell = (
    text: string,
    opts: {
      bg?:    string
      bold?:  boolean
      color?: string
      width?: number
    } = {}
  ) =>
    new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text:  text ?? '',
              bold:  opts.bold  ?? false,
              size:  16,
              color: opts.color ?? '222222'
            })
          ],
          spacing: { before: 80, after: 80 }
        })
      ],
      shading:  opts.bg
        ? { type: ShadingType.CLEAR, fill: opts.bg }
        : { type: ShadingType.CLEAR, fill: 'FFFFFF' },
      borders:  allBorders,
      width:    opts.width
        ? { size: opts.width, type: WidthType.DXA }
        : undefined,
      margins:  { top: 100, bottom: 100, left: 160, right: 160 }
    })

  // ── Paragraphe titre section ──
  const makeSection = (title: string) =>
    new Paragraph({
      children: [
        new TextRun({
          text:  title,
          bold:  true,
          size:  22,
          color: '333333'
        })
      ],
      spacing: { before: 400, after: 120 },
      border: {
        bottom: {
          style: 'single' as const,
          size:  6,
          color: '39FF14'
        }
      }
    })

  // ── Label + valeur en ligne ──
  const makeInfoLine = (label: string, value: string) =>
    new Paragraph({
      children: [
        new TextRun({ text: `${label} : `, bold: true, size: 18, color: '555555' }),
        new TextRun({ text: value || '—',  bold: false, size: 18, color: '111111' })
      ],
      spacing: { before: 60, after: 60 }
    })

  // ════════════════════════════════════════════════
  // SECTION 1 — PAGE DE GARDE
  // ════════════════════════════════════════════════

  const coverPage = [
    new Paragraph({
      children: [
        new TextRun({
          text:  'PIPELINE PROSPECTS',
          bold:  true,
          size:  56,
          color: '111111'
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing:   { before: 2000, after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text:  'AUTOSLASH AI',
          bold:  true,
          size:  36,
          color: '39FF14'
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing:   { after: 600 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text:  `Exporté le ${new Date().toLocaleDateString('fr-FR')}`,
          size:  24,
          color: '888888'
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing:   { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text:  `${prospects.length} prospects`,
          bold:  true,
          size:  28,
          color: '333333'
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing:   { after: 2000 }
    }),
    // Ligne séparatrice
    new Paragraph({
      children: [new TextRun({ text: '' })],
      border: {
        bottom: { style: 'single' as const, size: 12, color: '39FF14' }
      },
      spacing: { after: 400 }
    }),
    new Paragraph({
      pageBreakBefore: true,
      children: [new TextRun({ text: '' })]
    })
  ]

  // ════════════════════════════════════════════════
  // SECTION 2 — TABLEAU SYNTHÈSE
  // ════════════════════════════════════════════════

  const synthHeaderRow = new TableRow({
    tableHeader: true,
    children: [
      makeHeaderCell('ID',            1200),
      makeHeaderCell('NOM',           1600),
      makeHeaderCell('EMAIL',         2200),
      makeHeaderCell('TÉLÉPHONE',     1600),
      makeHeaderCell('PLAN',          1000),
      makeHeaderCell('TEMPLATE',      1800),
      makeHeaderCell('LIEN PREVIEW',  3000),
      makeHeaderCell('BUDGET (FCFA)', 1400),
      makeHeaderCell('STATUT',        1100),
      makeHeaderCell('RÉGION',        1200),
      makeHeaderCell('SECTEUR',       1200),
      makeHeaderCell('DATE',          1200),
    ]
  })

  const synthDataRows = prospects.map((p, idx) => {
    const bg = idx % 2 === 0 ? 'FFFFFF' : 'F8F8F8'
    const statusColor =
      p.prospect_status === 'CONVERTI' ? '229922' :
      p.prospect_status === 'RAPPELER' ? 'CC6600' :
      p.prospect_status === 'ANNULÉ'   ? 'AAAAAA' : '333333'

    return new TableRow({
      children: [
        makeDataCell(
          p.enterprise_id?.substring(0, 8) + '...',
          { bg, color: '999999' }
        ),
        makeDataCell(p.name ?? '',            { bg, bold: true }),
        makeDataCell(p.email ?? '',           { bg, color: '3355AA' }),
        makeDataCell(p.phone ?? '',           { bg }),
        makeDataCell(p.package_type ?? '',    { bg }),
        makeDataCell(p.template_title ?? '',  { bg }),
        makeDataCell(p.template_preview_url ?? '', { bg, color: '2255CC' }),
        makeDataCell(
          p.budget ? p.budget.toLocaleString('fr-FR') + ' F' : '—',
          { bg, bold: true, color: '116611' }
        ),
        makeDataCell(p.prospect_status ?? '', { bg, bold: true, color: statusColor }),
        makeDataCell(p.region ?? '',          { bg }),
        makeDataCell(p.sector ?? '',          { bg }),
        makeDataCell(
          new Date(p.created_at).toLocaleDateString('fr-FR'),
          { bg }
        ),
      ]
    })
  })

  const syntheseTable = new Table({
    rows:  [synthHeaderRow, ...synthDataRows],
    width: { size: 100, type: WidthType.PERCENTAGE }
  })

  // ════════════════════════════════════════════════
  // SECTION 3 — FICHES DÉTAIL (1 par prospect)
  // ════════════════════════════════════════════════

  const fichesSections: Paragraph[] = []

  prospects.forEach((p, idx) => {
    // Saut de page avant chaque fiche
    fichesSections.push(
      new Paragraph({
        pageBreakBefore: true,
        children: [new TextRun({ text: '' })]
      })
    )

    // Titre fiche
    fichesSections.push(
      new Paragraph({
        children: [
          new TextRun({
            text:  `${String(idx + 1).padStart(2, '0')}. ${p.name.toUpperCase()}`,
            bold:  true,
            size:  36,
            color: '111111'
          }),
          new TextRun({
            text:  `  [${p.package_type ?? ''}]`,
            bold:  true,
            size:  24,
            color: '888888'
          })
        ],
        spacing: { before: 200, after: 300 },
        border: {
          bottom: { style: 'single' as const, size: 8, color: 'DDDDDD' }
        }
      })
    )

    // Infos de contact
    fichesSections.push(makeSection('INFORMATIONS DE CONTACT'))
    fichesSections.push(makeInfoLine('ID Entreprise',   p.enterprise_id ?? ''))
    fichesSections.push(makeInfoLine('Email',           p.email         ?? ''))
    fichesSections.push(makeInfoLine('Téléphone',       p.phone         ?? ''))
    fichesSections.push(makeInfoLine('Région',          p.region        ?? ''))
    fichesSections.push(makeInfoLine('Secteur',         p.sector        ?? ''))

    // Commande
    fichesSections.push(makeSection('COMMANDE'))
    fichesSections.push(makeInfoLine('Plan',            p.package_type      ?? ''))
    fichesSections.push(makeInfoLine('Template',        p.template_title    ?? ''))
    fichesSections.push(makeInfoLine('Lien Preview',    p.template_preview_url ?? ''))
    fichesSections.push(makeInfoLine('Budget estimé',
      p.budget ? p.budget.toLocaleString('fr-FR') + ' FCFA' : '—'
    ))

    // Statut
    fichesSections.push(makeSection('SUIVI'))
    fichesSections.push(makeInfoLine('Statut',          p.prospect_status ?? ''))
    fichesSections.push(makeInfoLine('Date rappel',
      p.rappel_at
        ? new Date(p.rappel_at).toLocaleDateString('fr-FR')
        : '—'
    ))
    fichesSections.push(makeInfoLine('Date inscription',
      new Date(p.created_at).toLocaleDateString('fr-FR')
    ))

    // Message client complet
    fichesSections.push(makeSection('MESSAGE CLIENT'))
    fichesSections.push(
      new Paragraph({
        children: [
          new TextRun({
            text:  p.message || 'Aucun message',
            size:  18,
            color: p.message ? '222222' : 'AAAAAA',
            italics: !p.message
          })
        ],
        shading:  { type: ShadingType.CLEAR, fill: 'F8F8F8' },
        spacing:  { before: 80, after: 80 },
        indent:   { left: 200, right: 200 },
        border: {
          top:    { style: 'single' as const, size: 4, color: 'DDDDDD' },
          bottom: { style: 'single' as const, size: 4, color: 'DDDDDD' },
          left:   { style: 'thick'  as const, size: 8, color: 'CCCCCC' },
          right:  { style: 'single' as const, size: 4, color: 'DDDDDD' },
        }
      })
    )

    // Commentaire interne
    fichesSections.push(makeSection('COMMENTAIRE AMADOU'))
    fichesSections.push(
      new Paragraph({
        children: [
          new TextRun({
            text:    p.internal_notes || 'Aucun commentaire',
            size:    18,
            color:   p.internal_notes ? '222222' : 'AAAAAA',
            italics: !p.internal_notes
          })
        ],
        shading:  { type: ShadingType.CLEAR, fill: 'FFFBEA' },
        spacing:  { before: 80, after: 80 },
        indent:   { left: 200, right: 200 },
        border: {
          top:    { style: 'single' as const, size: 4, color: 'DDDDDD' },
          bottom: { style: 'single' as const, size: 4, color: 'DDDDDD' },
          left:   { style: 'thick'  as const, size: 8, color: 'DDCC00' },
          right:  { style: 'single' as const, size: 4, color: 'DDDDDD' },
        }
      })
    )
  })

  // ════════════════════════════════════════════════
  // ASSEMBLAGE FINAL
  // ════════════════════════════════════════════════

  const doc = new Document({
    styles: {
      paragraphStyles: [{
        id:   'Normal',
        name: 'Normal',
        run:  { font: 'Calibri', size: 18 }
      }]
    },
    sections: [
      // Section 1 : Page de garde
      {
        properties: {},
        children:   coverPage
      },
      // Section 2 : Tableau synthèse (paysage)
      {
        properties: {
          page: {
            size: {
              orientation: 'landscape' as const,
              width:  16838,
              height: 11906
            },
            margin: {
              top: 720, bottom: 720,
              left: 720, right: 720
            }
          }
        },
        children: [
          makeSection('TABLEAU DE SYNTHÈSE'),
          syntheseTable
        ]
      },
      // Section 3 : Fiches détail (portrait)
      {
        properties: {
          page: {
            size: {
              orientation: 'portrait' as const,
              width:  11906,
              height: 16838
            },
            margin: {
              top: 1000, bottom: 1000,
              left: 1200, right: 1200
            }
          }
        },
        children: fichesSections
      }
    ]
  })

  const buffer = await Packer.toBuffer(doc)
  saveAs(new Blob([buffer]), `${filename}.docx`)
}
