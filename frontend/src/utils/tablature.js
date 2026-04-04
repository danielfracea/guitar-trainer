export const STRING_NAMES = ['e', 'B', 'G', 'D', 'A', 'E']

export function emptyNote() {
  return { e: '', B: '', G: '', D: '', A: '', E: '' }
}

export function emptyBar(beatsPerBar) {
  return { notes: Array.from({ length: beatsPerBar }, emptyNote) }
}

/**
 * Sanitize a fret value string.
 * Returns a valid fret string ('0'–'24') or '' for invalid / empty input.
 */
export function sanitizeFretValue(val) {
  if (val === '' || val === null || val === undefined) return ''
  const n = parseInt(val, 10)
  if (isNaN(n) || n < 0) return ''
  if (n > 24) return '24'
  return String(n)
}

/**
 * Resize a bars array so each bar has exactly `beatsPerBar` notes.
 * Existing notes are preserved; missing positions are filled with empty notes.
 */
export function resizeBars(bars, beatsPerBar) {
  return bars.map(bar => {
    const notes = Array.from(
      { length: beatsPerBar },
      (_, i) => bar.notes[i] || emptyNote(),
    )
    return { notes }
  })
}

/**
 * Generate an ASCII-tab representation of a tablature.
 * @param {string} name
 * @param {{ numerator: number, denominator: number }} timeSignature
 * @param {Array} bars
 * @returns {string}
 */
export function generateAsciiTab(name, timeSignature, bars) {
  const ts = `${timeSignature.numerator}/${timeSignature.denominator}`
  const header = `${name} (${ts})\n`
  const separator = '='.repeat(header.length - 1)

  const rows = STRING_NAMES.map(s => {
    let line = `${s}|`
    for (const bar of bars) {
      for (const note of bar.notes) {
        const val = note[s]
        const cell = (val !== '' && val !== null && val !== undefined) ? String(val) : '-'
        if (cell.length === 1) line += `--${cell}-`
        else if (cell.length === 2) line += `-${cell}-`
        else line += cell
      }
      line += '|'
    }
    return line
  })

  return [header, separator, ...rows, ''].join('\n')
}
