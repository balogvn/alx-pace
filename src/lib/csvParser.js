/**
 * Deterministic CSV parser (RFC 4180-aware).
 *
 * Google Agentic-Engineering principle applied here: "Deterministic Tool &
 * Data Normalization". This is a small, fully predictable state machine — no
 * heuristics, no AI, no ambiguity. The same bytes always parse to the same
 * table, which is exactly what a pacing engine needs.
 *
 * Handles:
 *   - Quoted fields containing commas, CR, LF and CRLF.
 *   - Escaped double-quotes inside quoted fields ("" -> ").
 *   - Mixed CRLF / LF / CR line endings.
 *   - A trailing newline (does not emit a phantom empty row).
 *   - A leading UTF-8 BOM.
 */

/**
 * Parse raw CSV text into an array of string[] rows.
 * @param {string} input
 * @returns {string[][]}
 */
export function parseCsv(input) {
  if (typeof input !== 'string') return []

  // Strip a leading BOM if present.
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input

  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  const pushField = () => {
    row.push(field)
    field = ''
  }

  const pushRow = () => {
    pushField()
    rows.push(row)
    row = []
  }

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    if (inQuotes) {
      if (ch === '"') {
        // An escaped quote ("") collapses to a single literal quote.
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
      continue
    }

    // A quote only opens a quoted field when it is the first char of the field.
    if (ch === '"' && field.length === 0) {
      inQuotes = true
      continue
    }

    if (ch === ',') {
      pushField()
      continue
    }

    if (ch === '\r') {
      // Treat CRLF and a lone CR as a single row terminator.
      if (text[i + 1] === '\n') i++
      pushRow()
      continue
    }

    if (ch === '\n') {
      pushRow()
      continue
    }

    field += ch
  }

  // Flush the final field/row unless the file ended exactly on a row
  // terminator (in which case both row and field are empty — nothing pending).
  if (field.length > 0 || row.length > 0) {
    pushRow()
  }

  return rows
}

/**
 * Forward-fill (a.k.a. "merged cell" fill) selected columns.
 *
 * Spreadsheet exports leave the Module and Week cells blank on continuation
 * rows because the source used merged cells. We carry the last non-empty value
 * downward so every content row is deterministically tied to its Module/Week.
 *
 * @param {string[][]} rows
 * @param {number[]} columnIndexes columns to forward-fill
 * @returns {string[][]} a new array of rows (input is not mutated)
 */
export function forwardFill(rows, columnIndexes) {
  const carried = {}
  return rows.map((row) => {
    const next = row.slice()
    for (const col of columnIndexes) {
      const value = (next[col] ?? '').trim()
      if (value !== '') {
        carried[col] = value
      } else if (carried[col] != null) {
        next[col] = carried[col]
      }
    }
    return next
  })
}
