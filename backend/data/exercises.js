const defaultExercises = [
  {
    id: 1,
    name: "Scale Practice",
    description: "Practice major and minor scales across the fretboard to build finger dexterity and muscle memory.",
    type: "scale",
    settings: {
      rootNote: "C",
      scaleType: "major",
      tempo: 60,
      positions: [1]
    }
  },
  {
    id: 2,
    name: "Chord Transitions",
    description: "Smoothly transition between open chords to build chord muscle memory and timing.",
    type: "chords",
    settings: {
      chords: ["G", "C", "D", "Em"],
      tempo: 60,
      beatsPerChord: 4
    }
  },
  {
    id: 3,
    name: "Fingerpicking Pattern",
    description: "Develop right-hand fingerpicking technique with classic PIMA patterns.",
    type: "fingerpicking",
    settings: {
      pattern: "p-i-m-a",
      tempo: 80,
      strings: [6, 4, 3, 2]
    }
  },
  {
    id: 4,
    name: "Barre Chord Practice",
    description: "Build strength and accuracy for barre chords — the essential stepping stone to advanced guitar.",
    type: "barre",
    settings: {
      chord: "F",
      tempo: 60,
      repetitions: 4
    }
  },
  {
    id: 5,
    name: "Pentatonic Runs",
    description: "Run through pentatonic minor scale positions to build lead guitar fluency and speed.",
    type: "scale",
    settings: {
      rootNote: "A",
      scaleType: "pentatonic_minor",
      tempo: 80,
      positions: [5]
    }
  }
];

// Deep copy so reset works
let exercises = JSON.parse(JSON.stringify(defaultExercises));

module.exports = { exercises, defaultExercises };
