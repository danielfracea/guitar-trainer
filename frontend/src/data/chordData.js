// Chord voicings database
// frets: [low E, A, D, G, B, high e]  –1 = muted (×), 0 = open (○), n = fret number
// startFret: lowest fret shown in the grid diagram (1 = nut visible)

export const CHORD_VOICINGS = {
  G: [
    { label: 'Open',  frets: [ 3,  2,  0,  0,  3,  3], startFret: 1 },
    { label: 'G/B',   frets: [-1,  2,  0,  0,  3,  3], startFret: 1 },
    { label: 'Barre', frets: [ 3,  5,  5,  4,  3,  3], startFret: 3 },
  ],
  C: [
    { label: 'Open',  frets: [-1,  3,  2,  0,  1,  0], startFret: 1 },
    { label: 'C/E',   frets: [ 0,  3,  2,  0,  1,  0], startFret: 1 },
    { label: 'Barre', frets: [ 8, 10, 10,  9,  8,  8], startFret: 8 },
  ],
  D: [
    { label: 'Open',  frets: [-1, -1,  0,  2,  3,  2], startFret: 1 },
    { label: 'D/F#',  frets: [ 2, -1,  0,  2,  3,  2], startFret: 1 },
    { label: 'Barre', frets: [-1,  5,  7,  7,  7,  5], startFret: 5 },
  ],
  Em: [
    { label: 'Open',  frets: [ 0,  2,  2,  0,  0,  0], startFret: 1 },
    { label: 'Em/G',  frets: [ 3,  2,  2,  0,  0,  0], startFret: 1 },
    { label: 'Barre', frets: [-1,  7,  9,  9,  8,  7], startFret: 7 },
  ],
  Am: [
    { label: 'Open',  frets: [-1,  0,  2,  2,  1,  0], startFret: 1 },
    { label: 'Am/C',  frets: [-1,  3,  2,  2,  1,  0], startFret: 1 },
    { label: 'Barre', frets: [ 5,  7,  7,  5,  5,  5], startFret: 5 },
  ],
  E: [
    { label: 'Open',  frets: [ 0,  2,  2,  1,  0,  0], startFret: 1 },
    { label: 'E/G#',  frets: [ 4,  2,  2,  1,  0,  0], startFret: 1 },
    { label: 'Barre', frets: [-1,  7,  9,  9,  9,  7], startFret: 7 },
  ],
  A: [
    { label: 'Open',  frets: [-1,  0,  2,  2,  2,  0], startFret: 1 },
    { label: 'A/C#',  frets: [-1,  4,  2,  2,  2,  0], startFret: 1 },
    { label: 'Barre', frets: [ 5,  7,  7,  6,  5,  5], startFret: 5 },
  ],
  Dm: [
    { label: 'Open',  frets: [-1, -1,  0,  2,  3,  1], startFret: 1 },
    { label: 'Dm/F',  frets: [ 1, -1,  0,  2,  3,  1], startFret: 1 },
    { label: 'Barre', frets: [-1,  5,  7,  7,  6,  5], startFret: 5 },
  ],
  F: [
    { label: 'Barre', frets: [ 1,  3,  3,  2,  1,  1], startFret: 1 },
    { label: 'F/A',   frets: [-1,  0,  3,  2,  1,  1], startFret: 1 },
    { label: 'High',  frets: [ 8, 10, 10,  9,  8,  8], startFret: 8 },
  ],
  Bm: [
    { label: 'Barre', frets: [-1,  2,  4,  4,  3,  2], startFret: 2 },
    { label: 'Bm/D',  frets: [-1,  5,  4,  4,  3,  2], startFret: 2 },
    { label: 'High',  frets: [ 7,  9,  9,  7,  7,  7], startFret: 7 },
  ],
  B: [
    { label: 'Barre', frets: [-1,  2,  4,  4,  4,  2], startFret: 2 },
    { label: 'Alt',   frets: [-1, -1,  4,  4,  4,  2], startFret: 2 },
    { label: 'High',  frets: [ 7,  9,  9,  8,  7,  7], startFret: 7 },
  ],
  'F#m': [
    { label: 'Barre',  frets: [ 2,  4,  4,  2,  2,  2], startFret: 2 },
    { label: 'F#m/A', frets: [-1,  0,  4,  2,  2,  2], startFret: 1 },
    { label: 'High',  frets: [-1,  9, 11, 11, 10,  9], startFret: 9 },
  ],
  'C#m': [
    { label: 'Barre',  frets: [-1,  4,  6,  6,  5,  4], startFret: 4 },
    { label: 'C#m/E', frets: [ 0,  4,  6,  6,  5,  4], startFret: 4 },
    { label: 'High',  frets: [ 9, 11, 11,  9,  9,  9], startFret: 9 },
  ],
  Bb: [
    { label: 'Barre', frets: [-1,  1,  3,  3,  3,  1], startFret: 1 },
    { label: 'High',  frets: [ 6,  8,  8,  7,  6,  6], startFret: 6 },
  ],
  Gm: [
    { label: 'Barre', frets: [ 3,  5,  5,  3,  3,  3], startFret: 3 },
    { label: 'High',  frets: [-1, 10, 12, 12, 11, 10], startFret: 10 },
  ],
  G7: [
    { label: 'Open',  frets: [ 3,  2,  0,  0,  0,  1], startFret: 1 },
    { label: 'G7/B',  frets: [-1,  2,  0,  0,  0,  1], startFret: 1 },
    { label: 'Barre', frets: [ 3,  5,  3,  4,  3,  3], startFret: 3 },
  ],
  C7: [
    { label: 'Open',  frets: [-1,  3,  2,  3,  1,  0], startFret: 1 },
    { label: 'C7/E',  frets: [ 0,  3,  2,  3,  1,  0], startFret: 1 },
    { label: 'Barre', frets: [ 8, 10,  8,  9,  8,  8], startFret: 8 },
  ],
  D7: [
    { label: 'Open',  frets: [-1, -1,  0,  2,  1,  2], startFret: 1 },
    { label: 'D7/F#', frets: [ 2, -1,  0,  2,  1,  2], startFret: 1 },
    { label: 'Barre', frets: [-1,  5,  7,  5,  7,  5], startFret: 5 },
  ],
  E7: [
    { label: 'Open',  frets: [ 0,  2,  0,  1,  0,  0], startFret: 1 },
    { label: 'E7/G#', frets: [ 4,  2,  0,  1,  0,  0], startFret: 1 },
    { label: 'Barre', frets: [-1,  7,  9,  7,  9,  7], startFret: 7 },
  ],
  A7: [
    { label: 'Open',  frets: [-1,  0,  2,  0,  2,  0], startFret: 1 },
    { label: 'A7/C#', frets: [-1,  4,  2,  0,  2,  0], startFret: 1 },
    { label: 'Barre', frets: [ 5,  7,  5,  6,  5,  5], startFret: 5 },
  ],
}

// Common chord companions based on diatonic harmony
export const RELATED_CHORDS = {
  G:    ['C', 'D', 'Em', 'Am'],
  C:    ['G', 'F', 'Am', 'Dm'],
  D:    ['G', 'A', 'Bm', 'Em'],
  Em:   ['G', 'C', 'D', 'Am'],
  Am:   ['C', 'G', 'F', 'Em'],
  E:    ['A', 'B', 'F#m', 'C#m'],
  A:    ['D', 'E', 'F#m', 'Bm'],
  F:    ['C', 'Dm', 'Am', 'Bb'],
  Bm:   ['G', 'D', 'A', 'Em'],
  Dm:   ['F', 'C', 'Am', 'Gm'],
  B:    ['E', 'F#m', 'C#m', 'G#m'],
  'F#m':['D', 'A', 'E', 'Bm'],
  'C#m':['A', 'E', 'B', 'F#m'],
  Bb:   ['F', 'C', 'Dm', 'Gm'],
  Gm:   ['Bb', 'F', 'Dm', 'Cm'],
  G7:   ['C', 'F', 'Am', 'Dm'],
  C7:   ['F', 'Bb', 'Dm', 'Gm'],
  D7:   ['G', 'C', 'Em', 'Am'],
  E7:   ['A', 'D', 'F#m', 'Bm'],
  A7:   ['D', 'G', 'Bm', 'Em'],
}
