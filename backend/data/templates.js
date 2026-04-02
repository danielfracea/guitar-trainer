const defaultTemplates = [
  {
    id: 1,
    name: "Beginner Foundations",
    description: "A balanced 25-minute session covering essential scale and chord fundamentals for beginners.",
    totalDuration: 25,
    icon: "🌱",
    level: "Beginner",
    exercises: [
      { exerciseId: 1, exerciseName: "Scale Practice", duration: 10, tip: "Start slowly and focus on clean fingering" },
      { exerciseId: 2, exerciseName: "Chord Transitions", duration: 15, tip: "Aim for smooth, gap-free chord changes" }
    ]
  },
  {
    id: 2,
    name: "Chord Mastery",
    description: "Focus entirely on chord technique — transitions and barre chords for a solid rhythm foundation.",
    totalDuration: 20,
    icon: "🎵",
    level: "Intermediate",
    exercises: [
      { exerciseId: 2, exerciseName: "Chord Transitions", duration: 10, tip: "Use a metronome and do not rush" },
      { exerciseId: 4, exerciseName: "Barre Chord Practice", duration: 10, tip: "Press down firmly but avoid tension in your wrist" }
    ]
  },
  {
    id: 3,
    name: "Lead Guitar Focus",
    description: "Develop your lead playing with scale runs and pentatonic patterns. Great for soloing skills.",
    totalDuration: 25,
    icon: "⚡",
    level: "Intermediate",
    exercises: [
      { exerciseId: 1, exerciseName: "Scale Practice", duration: 10, tip: "Practice ascending and descending equally" },
      { exerciseId: 5, exerciseName: "Pentatonic Runs", duration: 15, tip: "Lock in with the metronome before increasing speed" }
    ]
  },
  {
    id: 4,
    name: "Fingerstyle Session",
    description: "A fingerpicking-focused routine to develop right-hand independence and chord melody skills.",
    totalDuration: 20,
    icon: "🖐️",
    level: "Intermediate",
    exercises: [
      { exerciseId: 3, exerciseName: "Fingerpicking Pattern", duration: 10, tip: "Keep your thumb anchored on the bass strings" },
      { exerciseId: 2, exerciseName: "Chord Transitions", duration: 10, tip: "Try picking each chord arpeggiated instead of strumming" }
    ]
  },
  {
    id: 5,
    name: "Full Daily Routine",
    description: "The complete 45-minute practice session hitting every technique area. Perfect for consistent daily players.",
    totalDuration: 45,
    icon: "🏆",
    level: "Advanced",
    exercises: [
      { exerciseId: 1, exerciseName: "Scale Practice", duration: 10, tip: "Warm up at a comfortable tempo" },
      { exerciseId: 2, exerciseName: "Chord Transitions", duration: 10, tip: "Run through all your common chord shapes" },
      { exerciseId: 3, exerciseName: "Fingerpicking Pattern", duration: 8, tip: "Practice with eyes closed to develop feel" },
      { exerciseId: 4, exerciseName: "Barre Chord Practice", duration: 7, tip: "Work on clean fretting before speed" },
      { exerciseId: 5, exerciseName: "Pentatonic Runs", duration: 10, tip: "Finish with something fun — improvise freely" }
    ]
  }
];

module.exports = { defaultTemplates };
