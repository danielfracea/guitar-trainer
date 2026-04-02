const defaultTemplates = [
  {
    id: 1,
    name: "Beginner Foundations",
    description: "A balanced 25-minute session covering essential scale and chord fundamentals for beginners.",
    totalDuration: 25,
    icon: "🌱",
    level: "Beginner",
    tip: "Start slowly and focus on clean fingering before increasing speed",
    exercises: [
      { exerciseId: 1, exerciseName: "Scale Practice", duration: 10 },
      { exerciseId: 2, exerciseName: "Chord Transitions", duration: 15 }
    ]
  },
  {
    id: 2,
    name: "Chord Mastery",
    description: "Focus entirely on chord technique — transitions and barre chords for a solid rhythm foundation.",
    totalDuration: 20,
    icon: "🎵",
    level: "Intermediate",
    tip: "Use a metronome and do not rush — smooth transitions beat fast ones",
    exercises: [
      { exerciseId: 2, exerciseName: "Chord Transitions", duration: 10 },
      { exerciseId: 4, exerciseName: "Barre Chord Practice", duration: 10 }
    ]
  },
  {
    id: 3,
    name: "Lead Guitar Focus",
    description: "Develop your lead playing with scale runs and pentatonic patterns. Great for soloing skills.",
    totalDuration: 25,
    icon: "⚡",
    level: "Intermediate",
    tip: "Lock in with the metronome before increasing speed",
    exercises: [
      { exerciseId: 1, exerciseName: "Scale Practice", duration: 10 },
      { exerciseId: 5, exerciseName: "Pentatonic Runs", duration: 15 }
    ]
  },
  {
    id: 4,
    name: "Fingerstyle Session",
    description: "A fingerpicking-focused routine to develop right-hand independence and chord melody skills.",
    totalDuration: 20,
    icon: "🖐️",
    level: "Intermediate",
    tip: "Keep your thumb anchored on the bass strings for a steady pulse",
    exercises: [
      { exerciseId: 3, exerciseName: "Fingerpicking Pattern", duration: 10 },
      { exerciseId: 2, exerciseName: "Chord Transitions", duration: 10 }
    ]
  },
  {
    id: 5,
    name: "Full Daily Routine",
    description: "The complete 45-minute practice session hitting every technique area. Perfect for consistent daily players.",
    totalDuration: 45,
    icon: "🏆",
    level: "Advanced",
    tip: "Warm up at a comfortable tempo and finish by improvising freely",
    exercises: [
      { exerciseId: 1, exerciseName: "Scale Practice", duration: 10 },
      { exerciseId: 2, exerciseName: "Chord Transitions", duration: 10 },
      { exerciseId: 3, exerciseName: "Fingerpicking Pattern", duration: 8 },
      { exerciseId: 4, exerciseName: "Barre Chord Practice", duration: 7 },
      { exerciseId: 5, exerciseName: "Pentatonic Runs", duration: 10 }
    ]
  }
];

module.exports = { defaultTemplates };
