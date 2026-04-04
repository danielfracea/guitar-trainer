import { describe, it, expect } from 'vitest';
import {
  STRING_NAMES,
  emptyNote,
  emptyBar,
  sanitizeFretValue,
  resizeBars,
  generateAsciiTab,
} from '../../utils/tablature.js';

describe('STRING_NAMES', () => {
  it('has 6 strings in standard order', () => {
    expect(STRING_NAMES).toEqual(['e', 'B', 'G', 'D', 'A', 'E']);
  });
});

describe('emptyNote', () => {
  it('returns an object with all 6 strings set to empty string', () => {
    const note = emptyNote();
    for (const s of STRING_NAMES) {
      expect(note[s]).toBe('');
    }
  });

  it('returns a new object each call', () => {
    const a = emptyNote();
    const b = emptyNote();
    a.e = '5';
    expect(b.e).toBe('');
  });
});

describe('emptyBar', () => {
  it('returns a bar with the correct number of notes for 4/4', () => {
    const bar = emptyBar(4);
    expect(bar.notes).toHaveLength(4);
  });

  it('returns a bar with the correct number of notes for 3/4', () => {
    const bar = emptyBar(3);
    expect(bar.notes).toHaveLength(3);
  });

  it('each note in the bar is an emptyNote', () => {
    const bar = emptyBar(2);
    for (const note of bar.notes) {
      for (const s of STRING_NAMES) {
        expect(note[s]).toBe('');
      }
    }
  });
});

describe('sanitizeFretValue', () => {
  it('returns empty string for empty input', () => {
    expect(sanitizeFretValue('')).toBe('');
    expect(sanitizeFretValue(null)).toBe('');
    expect(sanitizeFretValue(undefined)).toBe('');
  });

  it('returns empty string for non-numeric input', () => {
    expect(sanitizeFretValue('abc')).toBe('');
    expect(sanitizeFretValue('x')).toBe('');
  });

  it('returns empty string for negative values', () => {
    expect(sanitizeFretValue('-1')).toBe('');
    expect(sanitizeFretValue('-5')).toBe('');
  });

  it('returns "0" for fret 0', () => {
    expect(sanitizeFretValue('0')).toBe('0');
  });

  it('returns the fret as a string for valid values', () => {
    expect(sanitizeFretValue('5')).toBe('5');
    expect(sanitizeFretValue('12')).toBe('12');
    expect(sanitizeFretValue('24')).toBe('24');
  });

  it('clamps values above 24 to "24"', () => {
    expect(sanitizeFretValue('25')).toBe('24');
    expect(sanitizeFretValue('99')).toBe('24');
  });

  it('parses decimal input by truncating', () => {
    expect(sanitizeFretValue('7.9')).toBe('7');
  });
});

describe('resizeBars', () => {
  it('expands each bar to the new beat count by adding empty notes', () => {
    const bars = [
      { notes: [{ e: '0', B: '', G: '', D: '', A: '', E: '' }] },
    ];
    const resized = resizeBars(bars, 4);
    expect(resized[0].notes).toHaveLength(4);
    expect(resized[0].notes[0].e).toBe('0');
    expect(resized[0].notes[1].e).toBe('');
  });

  it('trims each bar to the new beat count', () => {
    const bars = [
      {
        notes: [
          { e: '1', B: '', G: '', D: '', A: '', E: '' },
          { e: '2', B: '', G: '', D: '', A: '', E: '' },
          { e: '3', B: '', G: '', D: '', A: '', E: '' },
          { e: '4', B: '', G: '', D: '', A: '', E: '' },
        ],
      },
    ];
    const resized = resizeBars(bars, 3);
    expect(resized[0].notes).toHaveLength(3);
    expect(resized[0].notes[2].e).toBe('3');
  });

  it('returns a new array (does not mutate input)', () => {
    const bars = [{ notes: [emptyNote(), emptyNote()] }];
    const resized = resizeBars(bars, 2);
    expect(resized).not.toBe(bars);
  });

  it('handles multiple bars', () => {
    const bars = [
      { notes: [emptyNote(), emptyNote()] },
      { notes: [emptyNote(), emptyNote()] },
    ];
    const resized = resizeBars(bars, 3);
    expect(resized).toHaveLength(2);
    resized.forEach(bar => expect(bar.notes).toHaveLength(3));
  });
});

describe('generateAsciiTab', () => {
  const ts44 = { numerator: 4, denominator: 4 };

  it('includes the tab name and time signature in the header', () => {
    const result = generateAsciiTab('My Song', ts44, []);
    expect(result).toContain('My Song (4/4)');
  });

  it('includes a separator line', () => {
    const result = generateAsciiTab('X', ts44, []);
    expect(result).toMatch(/={2,}/);
  });

  it('includes all 6 string labels', () => {
    const result = generateAsciiTab('Test', ts44, []);
    for (const s of STRING_NAMES) {
      expect(result).toContain(`${s}|`);
    }
  });

  it('renders a single-digit fret with padding --0-', () => {
    const bar = {
      notes: [{ e: '0', B: '', G: '', D: '', A: '', E: '' }],
    };
    const result = generateAsciiTab('T', { numerator: 1, denominator: 4 }, [bar]);
    expect(result).toContain('--0-');
  });

  it('renders a two-digit fret with padding -12-', () => {
    const bar = {
      notes: [{ e: '12', B: '', G: '', D: '', A: '', E: '' }],
    };
    const result = generateAsciiTab('T', { numerator: 1, denominator: 4 }, [bar]);
    expect(result).toContain('-12-');
  });

  it('renders empty fret positions as ----', () => {
    const bar = { notes: [emptyNote()] };
    const result = generateAsciiTab('T', { numerator: 1, denominator: 4 }, [bar]);
    // Each empty string cell => --{-}-  i.e. '----'
    expect(result).toContain('----');
  });

  it('inserts bar separators (|) between bars', () => {
    const bar1 = { notes: [emptyNote()] };
    const bar2 = { notes: [emptyNote()] };
    const result = generateAsciiTab('T', { numerator: 1, denominator: 4 }, [bar1, bar2]);
    // Should have at least two | per string row
    const lines = result.split('\n').filter(l => l.startsWith('e|'));
    expect(lines[0].split('|').length - 1).toBeGreaterThanOrEqual(2);
  });

  it('handles 3/4 time signature', () => {
    const ts34 = { numerator: 3, denominator: 4 };
    const bar = {
      notes: [
        { e: '0', B: '', G: '', D: '', A: '', E: '' },
        { e: '2', B: '', G: '', D: '', A: '', E: '' },
        { e: '3', B: '', G: '', D: '', A: '', E: '' },
      ],
    };
    const result = generateAsciiTab('Waltz', ts34, [bar]);
    expect(result).toContain('Waltz (3/4)');
    expect(result).toContain('--0-');
    expect(result).toContain('--2-');
    expect(result).toContain('--3-');
  });
});
