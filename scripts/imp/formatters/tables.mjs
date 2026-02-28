export function formatMarkdownTable(headers, rows) {
  if (rows.length === 0) return 'No data.'

  const widths = headers.map((h, i) => {
    const colValues = rows.map(r => String(r[h] || r[i] || '').length)
    return Math.max(h.length, ...colValues)
  })

  const headerLine = '| ' + headers.map((h, i) => h.padEnd(widths[i])).join(' | ') + ' |'
  const separator = '| ' + widths.map(w => '-'.repeat(w)).join(' | ') + ' |'
  const dataLines = rows.map(row => {
    const cells = headers.map((h, i) => {
      const val = String(row[h] || row[i] || '')
      return val.padEnd(widths[i])
    })
    return '| ' + cells.join(' | ') + ' |'
  })

  return [headerLine, separator, ...dataLines].join('\n')
}

export function truncate(str, maxLen = 50) {
  if (!str) return ''
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str
}
