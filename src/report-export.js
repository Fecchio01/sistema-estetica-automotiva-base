const headers = ['Cliente', 'Serviço', 'Valor', 'Status']

const escapeCsv = (value) => {
  const text = String(value ?? '')
  return /[;",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function reportRowsToCsv(rows = []) {
  const lines = rows.map((row) => [row.client, row.service, row.amount, row.status].map(escapeCsv).join(';'))
  return [headers.join(';'), ...lines].join('\r\n')
}

export function downloadReportCsv(rows = [], filename = 'relatorio-operacional.csv') {
  const blob = new Blob([`\uFEFF${reportRowsToCsv(rows)}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  setTimeout(() => { link.remove(); URL.revokeObjectURL(url) }, 0)
}

globalThis.__reportRowsToCsv = reportRowsToCsv
globalThis.__downloadReportCsv = downloadReportCsv
