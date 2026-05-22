import * as XLSX from 'xlsx'

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



export function exportTXT(
  prospects: ProspectExport[],
  filename: string
) {
  const line  = '─'.repeat(80)
  const dline = '═'.repeat(80)

  let content = ''

  // ── EN-TÊTE ──
  content += dline + '\n'
  content += '  PIPELINE PROSPECTS — AUTOSLASH AI\n'
  content += `  Exporté le : ${new Date().toLocaleDateString('fr-FR')}\n`
  content += `  Nombre de prospects : ${prospects.length}\n`
  content += dline + '\n\n'

  // ── TABLEAU SYNTHÈSE ──
  content += '  TABLEAU DE SYNTHÈSE\n'
  content += line + '\n'
  content += padR('NOM',            22)
  content += padR('PLAN',           14)
  content += padR('STATUT',         14)
  content += padR('BUDGET (FCFA)',  18)
  content += padR('RÉGION',         14)
  content += padR('DATE',           12)
  content += '\n'
  content += line + '\n'

  prospects.forEach(p => {
    content += padR(p.name ?? '',                        22)
    content += padR(p.package_type ?? '',                14)
    content += padR(p.prospect_status ?? '',             14)
    content += padR(
      p.budget ? p.budget.toLocaleString('fr-FR') + ' F' : '—',
      18
    )
    content += padR(p.region ?? '',                      14)
    content += padR(
      new Date(p.created_at).toLocaleDateString('fr-FR'),
      12
    )
    content += '\n'
  })

  content += line + '\n\n\n'

  // ── FICHES DÉTAIL ──
  prospects.forEach((p, idx) => {
    content += dline + '\n'
    content += `  ${String(idx + 1).padStart(2, '0')}. ${p.name.toUpperCase()}`
    content += `   [${p.package_type ?? ''}]\n`
    content += dline + '\n\n'

    content += '  CONTACT\n'
    content += line + '\n'
    content += row('ID',           p.enterprise_id ?? '')
    content += row('Email',        p.email         ?? '')
    content += row('Téléphone',    p.phone         ?? '')
    content += row('Région',       p.region        ?? '')
    content += row('Secteur',      p.sector        ?? '')
    content += '\n'

    content += '  COMMANDE\n'
    content += line + '\n'
    content += row('Plan',         p.package_type         ?? '')
    content += row('Template',     p.template_title       ?? '')
    content += row('Lien Preview', p.template_preview_url ?? '')
    content += row('Budget',
      p.budget ? p.budget.toLocaleString('fr-FR') + ' FCFA' : '—'
    )
    content += '\n'

    content += '  SUIVI\n'
    content += line + '\n'
    content += row('Statut',  p.prospect_status ?? '')
    content += row('Rappel',
      p.rappel_at
        ? new Date(p.rappel_at).toLocaleDateString('fr-FR')
        : '—'
    )
    content += row('Inscription',
      new Date(p.created_at).toLocaleDateString('fr-FR')
    )
    content += '\n'

    content += '  MESSAGE CLIENT\n'
    content += line + '\n'
    content += (p.message ?? 'Aucun message')
      .split('\n')
      .map(l => `  ${l}`)
      .join('\n')
    content += '\n\n'

    content += '  COMMENTAIRE\n'
    content += line + '\n'
    content += (p.internal_notes ?? 'Aucun commentaire')
      .split('\n')
      .map(l => `  ${l}`)
      .join('\n')
    content += '\n\n\n'
  })

  // ── PIED DE PAGE ──
  content += dline + '\n'
  content += `  FIN DU RAPPORT — ${prospects.length} prospects\n`
  content += dline + '\n'

  // ── TÉLÉCHARGEMENT ──
  const blob = new Blob(['\uFEFF' + content], {
    type: 'text/plain;charset=utf-8;'
  })
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href  = url
  link.setAttribute('download', `${filename}.txt`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ── Helpers ──
function padR(text: string, width: number): string {
  const t = (text ?? '').substring(0, width - 1)
  return t.padEnd(width, ' ')
}

function row(label: string, value: string): string {
  return `  ${label.padEnd(16, ' ')} : ${value}\n`
}
