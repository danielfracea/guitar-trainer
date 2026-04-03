<script setup>
import { ref } from 'vue'

const lessons = [
  {
    id: 'scales',
    icon: '🎵',
    title: 'What Is a Scale?',
    level: 'Beginner',
    levelClass: 'level-beginner',
    summary: 'A scale is a sequence of notes ordered by pitch that forms the tonal foundation of music.',
    body: [
      {
        heading: 'Definition',
        text: 'A scale is a set of musical notes arranged in ascending or descending order of pitch. Each scale is defined by its starting note (the root) and the pattern of intervals — the distances in semitones — between consecutive notes.'
      },
      {
        heading: 'The Major Scale',
        text: 'The most common scale in Western music is the major scale. It follows the interval pattern: Whole – Whole – Half – Whole – Whole – Whole – Half (W W H W W W H). For example, C major: C D E F G A B C.',
        highlight: 'C  D  E  F  G  A  B  C\n W  W  H  W  W  W  H'
      },
      {
        heading: 'The Minor Scale (Natural)',
        text: 'The natural minor scale uses the pattern: W H W W H W W. For example, A minor: A B C D E F G A — the same notes as C major but starting on A, giving it a darker feel.'
      },
      {
        heading: 'Why Scales Matter',
        text: 'Scales define what notes "belong" in a piece of music. They are the vocabulary of melody and improvisation. Knowing a scale means you always have a map of notes that will sound in key.'
      },
      {
        heading: 'On the Guitar',
        text: 'Scales are learned as fretboard patterns. A single scale shape can be moved up or down the neck to change the root note, making the guitar very efficient for scale practice.'
      }
    ]
  },
  {
    id: 'chords',
    icon: '🎸',
    title: 'What Is a Chord?',
    level: 'Beginner',
    levelClass: 'level-beginner',
    summary: 'A chord is three or more notes played simultaneously, creating harmony.',
    body: [
      {
        heading: 'Definition',
        text: 'A chord is formed when three or more notes are sounded at the same time. The most fundamental chords — triads — contain exactly three notes and are the building blocks of harmony in virtually every style of music.'
      },
      {
        heading: 'Major vs Minor Chords',
        text: 'A major chord sounds bright and happy. A minor chord sounds darker and more emotional. Both are triads built from three notes; only the middle note (the third) differs by one semitone.',
        highlight: 'C major:  C – E – G   (root, major 3rd, perfect 5th)\nC minor:  C – E♭ – G  (root, minor 3rd, perfect 5th)'
      },
      {
        heading: 'Open Chords on Guitar',
        text: 'Open chords use open (unfretted) strings alongside fretted notes. Common examples: E, A, D, G, C, Em, Am, Dm. They are the first chords most guitarists learn because they are approachable shapes that ring clearly.'
      },
      {
        heading: 'Barre Chords',
        text: 'A barre chord uses one finger to press all strings across one fret, acting as a moveable nut. This lets you take a single shape (e.g. E or A form) and play it at any fret to get any root note.'
      }
    ]
  },
  {
    id: 'chord-formation',
    icon: '🏗️',
    title: 'How Chords Form',
    level: 'Beginner',
    levelClass: 'level-beginner',
    summary: 'Chords are built by stacking specific intervals (thirds) on top of a root note taken from a scale.',
    body: [
      {
        heading: 'Stacking Thirds',
        text: 'The most common way to build a chord is to stack thirds — intervals of three or four semitones — on top of a chosen root. Starting on a note, you take every other note of the scale to build the chord.'
      },
      {
        heading: 'Building a Triad',
        text: 'From the C major scale (C D E F G A B), pick C as the root. Take the 1st, 3rd, and 5th scale degrees: C (1st) + E (3rd) + G (5th) = C major triad. This "skip-a-note" method works for every degree of the scale.',
        highlight: 'C major scale:  C  D  E  F  G  A  B\nPick 1, 3, 5:   C     E     G\nResult:         C major chord'
      },
      {
        heading: 'The Seven Diatonic Chords',
        text: 'Applying the same stacking-thirds process to every note of the C major scale produces seven chords, all naturally "in key". These are called diatonic chords:',
        highlight: 'I   – C major   (C E G)\nii  – D minor   (D F A)\niii – E minor   (E G B)\nIV  – F major   (F A C)\nV   – G major   (G B D)\nvi  – A minor   (A C E)\nvii° – B dim   (B D F)'
      },
      {
        heading: 'Adding the 7th',
        text: 'Extend a triad by stacking one more third to get a seventh chord. For example, C + E + G + B = Cmaj7. Seventh chords add colour and are common in jazz, blues, and pop.'
      },
      {
        heading: 'Roman Numeral Notation',
        text: 'Chords within a key are labelled with Roman numerals (I, ii, iii, IV, V, vi, vii°). Uppercase = major, lowercase = minor. This notation is key-independent — the I–IV–V progression works in any key.'
      }
    ]
  },
  {
    id: 'scale-over-chord',
    icon: '🌊',
    title: 'Scale Played Over a Chord',
    level: 'Intermediate',
    levelClass: 'level-intermediate',
    summary: 'Playing a compatible scale over a chord reveals how melody, improvisation, and harmony interlock.',
    body: [
      {
        heading: 'Why It Matters',
        text: 'When you play a scale whose notes match the chord underneath, every note you play will sound harmonious. This is the foundation of lead guitar, soloing, and melodic improvisation.'
      },
      {
        heading: 'The Basic Rule',
        text: 'A chord is built from certain scale degrees. When you improvise using that same scale over the chord, most notes will sound consonant because the chord\'s notes are all present in the scale.'
      },
      {
        heading: 'C Major Scale over C Major Chord',
        text: 'The chord C major contains C, E, G. The C major scale contains C D E F G A B. Play the scale while the chord rings — D, F, A, B are passing tones; C, E, G are chord tones that sound especially stable and resolved.',
        highlight: 'C major chord:  C  E  G\nC major scale:  C  D  E  F  G  A  B\nChord tones (✓): C  .  E  .  G  .  .\nPassing tones:   .  D  .  F  .  A  B'
      },
      {
        heading: 'The Pentatonic Shortcut',
        text: 'The pentatonic scale removes the two most "tense" notes of the major scale (the 4th and 7th), leaving only chord tones and safe passing tones. This makes pentatonic scales forgiving and great for beginners improvising over chords.',
        highlight: 'C major pentatonic: C  D  E  G  A\n(removes F and B from C major scale)'
      },
      {
        heading: 'Chord-Scale Relationships',
        text: 'Each chord type pairs with specific scales:',
        highlight: 'Major chord    → Major scale or major pentatonic\nMinor chord    → Natural minor scale or minor pentatonic\nDominant 7     → Mixolydian or blues scale\nMinor 7♭5      → Locrian mode'
      },
      {
        heading: 'Practical Exercise',
        text: 'Loop a C major chord (or a I–IV–V progression in C) and improvise using only the C major pentatonic scale. Listen for which notes sound most "at home" — those are the chord tones.'
      }
    ]
  },
  {
    id: 'arpeggios',
    icon: '🎼',
    title: 'Arpeggios: What They Are and How They Form',
    level: 'Intermediate',
    levelClass: 'level-intermediate',
    summary: 'An arpeggio is a chord played one note at a time, combining the clarity of melody with the harmony of chords.',
    body: [
      {
        heading: 'Definition',
        text: 'The word arpeggio comes from the Italian "arpeggiare" — to play the harp. A harp player cannot easily strum all strings at once, so notes of a chord are played in rapid succession. On guitar, an arpeggio means picking each note of a chord individually rather than strumming them together.'
      },
      {
        heading: 'How an Arpeggio Forms',
        text: 'An arpeggio contains exactly the same notes as the chord it represents — just spread out in time. A C major arpeggio uses C, E, G, the same three notes as the C major chord.',
        highlight: 'C major chord (strummed): C E G  (simultaneously)\nC major arpeggio (picked): C → E → G → E → C  (one by one)'
      },
      {
        heading: 'Types of Arpeggios',
        text: 'Like chords, arpeggios come in many flavours — major, minor, dominant 7th, diminished, augmented, and more. The pattern of intervals that defines the chord also defines the arpeggio.',
        highlight: 'Major arpeggio:   1 – 3 – 5       (e.g. C E G)\nMinor arpeggio:   1 – ♭3 – 5      (e.g. C E♭ G)\nMajor 7 arpeggio: 1 – 3 – 5 – 7   (e.g. C E G B)\nDom 7 arpeggio:   1 – 3 – 5 – ♭7  (e.g. C E G B♭)'
      },
      {
        heading: 'Arpeggios vs Scales',
        text: 'A scale runs through all the notes in a key step by step. An arpeggio skips between chord tones only. Arpeggios outline the harmony more precisely than scales — each note you play is "in the chord", making them great for targeting chord changes cleanly.'
      },
      {
        heading: 'Guitar Arpeggio Technique',
        text: 'Arpeggios on guitar are typically played with alternate picking (down-up-down-up) or with sweep picking — a flowing motion across multiple strings in one direction. Sweep picking lets you play arpeggios very fast and smoothly.'
      },
      {
        heading: 'Using Arpeggios in Practice',
        text: 'A great exercise: play the diatonic arpeggios up and down the neck in a given key. For C major, play C major arpeggio → D minor arpeggio → E minor arpeggio → ... This trains your ear and fingers to hear and feel each chord change individually.'
      }
    ]
  }
]

const openId = ref(null)

function toggle(id) {
  openId.value = openId.value === id ? null : id
}
</script>

<template>
  <div class="lessons-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">Lessons</h2>
        <p class="page-subtitle">Core music theory concepts every guitarist should know</p>
      </div>
    </div>

    <div class="lessons-list">
      <div
        v-for="lesson in lessons"
        :key="lesson.id"
        class="lesson-card"
        :class="{ open: openId === lesson.id }"
      >
        <button class="lesson-header" @click="toggle(lesson.id)">
          <div class="lesson-header-left">
            <span class="lesson-icon">{{ lesson.icon }}</span>
            <div class="lesson-meta">
              <span class="lesson-title">{{ lesson.title }}</span>
              <span class="lesson-summary">{{ lesson.summary }}</span>
            </div>
          </div>
          <div class="lesson-header-right">
            <span class="level-badge" :class="lesson.levelClass">{{ lesson.level }}</span>
            <span class="chevron" :class="{ rotated: openId === lesson.id }">›</span>
          </div>
        </button>

        <Transition name="expand">
          <div v-if="openId === lesson.id" class="lesson-body">
            <div
              v-for="(section, idx) in lesson.body"
              :key="idx"
              class="lesson-section"
            >
              <h4 class="section-heading">{{ section.heading }}</h4>
              <p class="section-text">{{ section.text }}</p>
              <pre v-if="section.highlight" class="section-highlight">{{ section.highlight }}</pre>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lessons-page {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-primary);
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.lessons-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lesson-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.lesson-card.open,
.lesson-card:hover {
  border-color: var(--accent-green);
  box-shadow: 0 4px 24px rgba(76, 175, 80, 0.1);
}

.lesson-header {
  width: 100%;
  background: none;
  border: none;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  gap: 16px;
  text-align: left;
}

.lesson-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.lesson-icon {
  font-size: 1.75rem;
  flex-shrink: 0;
  line-height: 1;
}

.lesson-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.lesson-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
}

.lesson-summary {
  font-size: 0.82rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.lesson-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.level-badge {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 3px 10px;
  border-radius: 20px;
}

.level-beginner {
  background: rgba(76, 175, 80, 0.15);
  color: #4caf50;
}

.level-intermediate {
  background: rgba(255, 179, 0, 0.15);
  color: #ffb300;
}

.chevron {
  font-size: 1.4rem;
  color: var(--text-muted);
  transition: transform 0.25s ease;
  display: inline-block;
  line-height: 1;
}

.chevron.rotated {
  transform: rotate(90deg);
}

/* Lesson body */
.lesson-body {
  padding: 0 24px 24px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.lesson-section {
  padding-top: 20px;
}

.section-heading {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--accent-green);
  margin: 0 0 6px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.section-text {
  font-size: 0.9rem;
  color: var(--text-primary);
  line-height: 1.65;
  margin: 0;
}

.section-highlight {
  margin: 10px 0 0;
  padding: 12px 16px;
  background: rgba(76, 175, 80, 0.05);
  border: 1px solid rgba(76, 175, 80, 0.2);
  border-left: 3px solid var(--accent-green);
  border-radius: 8px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.82rem;
  color: #a5d6a7;
  white-space: pre;
  overflow-x: auto;
  line-height: 1.7;
}

/* Expand transition */
.expand-enter-active,
.expand-leave-active {
  transition: opacity 0.2s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
}
</style>
