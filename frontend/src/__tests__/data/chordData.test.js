import { describe, it, expect } from 'vitest';
import { CHORD_VOICINGS, RELATED_CHORDS } from '../../data/chordData.js';

describe('CHORD_VOICINGS', () => {
  it('exports an object', () => {
    expect(typeof CHORD_VOICINGS).toBe('object');
    expect(CHORD_VOICINGS).not.toBeNull();
  });

  it('contains expected chord keys', () => {
    const expected = ['G', 'C', 'D', 'Em', 'Am', 'E', 'A', 'Dm', 'F'];
    expected.forEach(chord => {
      expect(CHORD_VOICINGS).toHaveProperty(chord);
    });
  });

  it('each chord has at least one voicing', () => {
    Object.entries(CHORD_VOICINGS).forEach(([chord, voicings]) => {
      expect(Array.isArray(voicings)).toBe(true);
      expect(voicings.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('each voicing has label, frets, and startFret', () => {
    Object.entries(CHORD_VOICINGS).forEach(([chord, voicings]) => {
      voicings.forEach(v => {
        expect(v).toHaveProperty('label');
        expect(v).toHaveProperty('frets');
        expect(v).toHaveProperty('startFret');
      });
    });
  });

  it('each frets array has exactly 6 elements', () => {
    Object.entries(CHORD_VOICINGS).forEach(([chord, voicings]) => {
      voicings.forEach(v => {
        expect(Array.isArray(v.frets)).toBe(true);
        expect(v.frets).toHaveLength(6);
      });
    });
  });

  it('fret values are integers >= -1', () => {
    Object.entries(CHORD_VOICINGS).forEach(([chord, voicings]) => {
      voicings.forEach(v => {
        v.frets.forEach(fret => {
          expect(Number.isInteger(fret)).toBe(true);
          expect(fret).toBeGreaterThanOrEqual(-1);
        });
      });
    });
  });

  it('startFret is a positive integer', () => {
    Object.entries(CHORD_VOICINGS).forEach(([chord, voicings]) => {
      voicings.forEach(v => {
        expect(Number.isInteger(v.startFret)).toBe(true);
        expect(v.startFret).toBeGreaterThanOrEqual(1);
      });
    });
  });

  it('G chord Open voicing has correct frets', () => {
    const open = CHORD_VOICINGS.G.find(v => v.label === 'Open');
    expect(open).toBeDefined();
    expect(open.frets).toEqual([3, 2, 0, 0, 3, 3]);
    expect(open.startFret).toBe(1);
  });

  it('contains 20 chords', () => {
    expect(Object.keys(CHORD_VOICINGS)).toHaveLength(20);
  });
});

describe('RELATED_CHORDS', () => {
  it('exports an object', () => {
    expect(typeof RELATED_CHORDS).toBe('object');
    expect(RELATED_CHORDS).not.toBeNull();
  });

  it('each value is an array of strings', () => {
    Object.entries(RELATED_CHORDS).forEach(([chord, related]) => {
      expect(Array.isArray(related)).toBe(true);
      related.forEach(r => expect(typeof r).toBe('string'));
    });
  });

  it('G resolves to expected related chords', () => {
    expect(RELATED_CHORDS.G).toEqual(['C', 'D', 'Em', 'Am']);
  });

  it('all related chord names reference existing chords or are valid strings', () => {
    Object.values(RELATED_CHORDS).forEach(related => {
      related.forEach(r => expect(typeof r).toBe('string'));
    });
  });
});
