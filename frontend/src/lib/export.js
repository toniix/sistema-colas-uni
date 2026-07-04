// Exportación simple de datos a CSV o JSON (descarga en el navegador).
function descargar(contenido, nombre, tipo) {
  const blob = new Blob([contenido], { type: tipo })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  URL.revokeObjectURL(url)
}

export function exportJSON(data, nombre = 'reporte.json') {
  descargar(JSON.stringify(data, null, 2), nombre, 'application/json')
}

export function exportCSV(rows, nombre = 'reporte.csv') {
  if (!rows || rows.length === 0) return
  const headers = Object.keys(rows[0])
  const escape = (v) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n')
  descargar(csv, nombre, 'text/csv;charset=utf-8')
}
