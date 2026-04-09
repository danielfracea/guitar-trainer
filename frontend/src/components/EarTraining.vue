<script setup>
import { ref, computed } from 'vue'

// ── Audio helpers ─────────────────────────────────────────────────────────────
let audioCtx = null

function getAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return audioCtx
}

function playTone(frequency, startTime, duration, type = 'sine', volume = 0.4) {
  const ctx = getAudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = type
  osc.frequency.setValueAtTime(frequency, startTime)
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.01)
  gain.gain.setValueAtTime(volume, startTime + duration - 0.05)
  gain.gain.linearRampToValueAtTime(0, startTime + duration)
  osc.start(startTime)
  osc.stop(startTime + duration)
}

// Base frequencies for octave 4 (index = semitone offset from C4)
const BASE_FREQ_C4 = 261.63
function semitonesToFreq(semitones) {
  return BASE_FREQ_C4 * Math.pow(2, semitones / 12)
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// ── Interval data ─────────────────────────────────────────────────────────────
const INTERVALS = [
  { name: 'Unison',    semitones: 0,  abbr: 'P1'  },
  { name: 'Minor 2nd', semitones: 1,  abbr: 'm2'  },
  { name: 'Major 2nd', semitones: 2,  abbr: 'M2'  },
  { name: 'Minor 3rd', semitones: 3,  abbr: 'm3'  },
  { name: 'Major 3rd', semitones: 4,  abbr: 'M3'  },
  { name: 'Perfect 4th', semitones: 5, abbr: 'P4' },
  { name: 'Tritone',   semitones: 6,  abbr: 'TT'  },
  { name: 'Perfect 5th', semitones: 7, abbr: 'P5' },
  { name: 'Minor 6th', semitones: 8,  abbr: 'm6'  },
  { name: 'Major 6th', semitones: 9,  abbr: 'M6'  },
  { name: 'Minor 7th', semitones: 10, abbr: 'm7'  },
  { name: 'Major 7th', semitones: 11, abbr: 'M7'  },
  { name: 'Octave',    semitones: 12, abbr: 'P8'  },
]

// ── Chord quality data ────────────────────────────────────────────────────────
const CHORD_QUALITIES = [
  { name: 'Major',      semitones: [0, 4, 7],     symbol: 'maj' },
  { name: 'Minor',      semitones: [0, 3, 7],     symbol: 'min' },
  { name: 'Diminished', semitones: [0, 3, 6],     symbol: 'dim' },
  { name: 'Augmented',  semitones: [0, 4, 8],     symbol: 'aug' },
  { name: 'Dominant 7th', semitones: [0, 4, 7, 10], symbol: 'dom7' },
  { name: 'Major 7th',  semitones: [0, 4, 7, 11], symbol: 'maj7' },
  { name: 'Minor 7th',  semitones: [0, 3, 7, 10], symbol: 'min7' },
]

// ── Rhythm patterns ───────────────────────────────────────────────────────────
const RHYTHM_PATTERNS = [
  {
    name: 'Basic Quarter Notes',
    description: '4 even beats',
    beats: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    labels: ['1', '2', '3', '4'],
    labelPositions: [0, 4, 8, 12],
  },
  {
    name: 'Eighth Note Groove',
    description: 'Alternating down/up strokes',
    beats: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    labels: ['1', '+', '2', '+', '3', '+', '4', '+'],
    labelPositions: [0, 2, 4, 6, 8, 10, 12, 14],
  },
  {
    name: 'Rock Backbeat',
    description: 'Accent beats 2 and 4',
    beats: [1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0],
    labels: ['1', '2', '3', '4'],
    labelPositions: [0, 4, 8, 12],
  },
  {
    name: 'Syncopated Funk',
    description: 'Off-beat accents',
    beats: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
    labels: ['1', 'e', '+', 'a', '2', 'e', '+', 'a', '3', 'e', '+', 'a', '4', 'e', '+', 'a'],
    labelPositions: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  },
]

// ── State: which exercise is active ──────────────────────────────────────────
const activeExercise = ref(null) // 'interval' | 'chord' | 'rhythm' | 'note'

// ── Exercise stats (shared) ───────────────────────────────────────────────────
function makeStats() {
  return { correct: 0, total: 0 }
}

// ── Interval exercise state ───────────────────────────────────────────────────
const intervalStats = ref(makeStats())
const intervalQuestion = ref(null)   // { rootSemitone, interval }
const intervalAnswer = ref(null)     // selected interval name
const intervalFeedback = ref(null)   // 'correct' | 'wrong'

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function fisherYates(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function shuffledChoices(correctInterval) {
  const others = INTERVALS.filter(i => i.name !== correctInterval.name)
  const shuffled = fisherYates(others).slice(0, 3)
  return fisherYates([...shuffled, correctInterval])
}

function newIntervalQuestion() {
  const rootSemitone = Math.floor(Math.random() * 12)
  const interval = getRandomItem(INTERVALS)
  intervalQuestion.value = { rootSemitone, interval, choices: shuffledChoices(interval) }
  intervalAnswer.value = null
  intervalFeedback.value = null
}

function playInterval() {
  if (!intervalQuestion.value) return
  const ctx = getAudioContext()
  const now = ctx.currentTime
  const root = semitonesToFreq(intervalQuestion.value.rootSemitone)
  const upper = semitonesToFreq(intervalQuestion.value.rootSemitone + intervalQuestion.value.interval.semitones)
  playTone(root, now, 1.2)
  playTone(upper, now + 1.3, 1.2)
}

function playIntervalHarmonic() {
  if (!intervalQuestion.value) return
  const ctx = getAudioContext()
  const now = ctx.currentTime
  const root = semitonesToFreq(intervalQuestion.value.rootSemitone)
  const upper = semitonesToFreq(intervalQuestion.value.rootSemitone + intervalQuestion.value.interval.semitones)
  playTone(root, now, 2)
  playTone(upper, now, 2)
}

function answerInterval(choice) {
  if (intervalAnswer.value) return
  intervalAnswer.value = choice.name
  const correct = choice.name === intervalQuestion.value.interval.name
  intervalFeedback.value = correct ? 'correct' : 'wrong'
  intervalStats.value.total++
  if (correct) intervalStats.value.correct++
}

// ── Chord exercise state ──────────────────────────────────────────────────────
const chordStats = ref(makeStats())
const chordQuestion = ref(null)  // { rootSemitone, quality }
const chordAnswer = ref(null)
const chordFeedback = ref(null)

function shuffledChordChoices(correctQuality) {
  const others = CHORD_QUALITIES.filter(q => q.name !== correctQuality.name)
  const shuffled = fisherYates(others).slice(0, 3)
  return fisherYates([...shuffled, correctQuality])
}

function newChordQuestion() {
  const rootSemitone = Math.floor(Math.random() * 12)
  const quality = getRandomItem(CHORD_QUALITIES)
  chordQuestion.value = { rootSemitone, quality, choices: shuffledChordChoices(quality) }
  chordAnswer.value = null
  chordFeedback.value = null
}

function playChord() {
  if (!chordQuestion.value) return
  const ctx = getAudioContext()
  const now = ctx.currentTime
  chordQuestion.value.quality.semitones.forEach((s, i) => {
    const freq = semitonesToFreq(chordQuestion.value.rootSemitone + s)
    playTone(freq, now + i * 0.08, 2.5, 'triangle', 0.25)
  })
}

function playChordBroken() {
  if (!chordQuestion.value) return
  const ctx = getAudioContext()
  const now = ctx.currentTime
  chordQuestion.value.quality.semitones.forEach((s, i) => {
    const freq = semitonesToFreq(chordQuestion.value.rootSemitone + s)
    playTone(freq, now + i * 0.35, 1.2, 'triangle', 0.3)
  })
}

function answerChord(choice) {
  if (chordAnswer.value) return
  chordAnswer.value = choice.name
  const correct = choice.name === chordQuestion.value.quality.name
  chordFeedback.value = correct ? 'correct' : 'wrong'
  chordStats.value.total++
  if (correct) chordStats.value.correct++
}

// ── Rhythm exercise state ─────────────────────────────────────────────────────
const rhythmStats = ref(makeStats())
const rhythmQuestion = ref(null)
const rhythmAnswer = ref(null)
const rhythmFeedback = ref(null)
const rhythmIsPlaying = ref(false)
const rhythmActiveBeat = ref(-1)

function shuffledRhythmChoices(correct) {
  const others = RHYTHM_PATTERNS.filter(p => p.name !== correct.name)
  const shuffled = fisherYates(others).slice(0, 2)
  return fisherYates([...shuffled, correct])
}

function newRhythmQuestion() {
  const pattern = getRandomItem(RHYTHM_PATTERNS)
  rhythmQuestion.value = { pattern, choices: shuffledRhythmChoices(pattern) }
  rhythmAnswer.value = null
  rhythmFeedback.value = null
  rhythmActiveBeat.value = -1
}

const BPM = 120
const STEP_DURATION = 60 / BPM / 4 // 16th note duration in seconds

function playRhythm() {
  if (!rhythmQuestion.value || rhythmIsPlaying.value) return
  rhythmIsPlaying.value = true
  rhythmActiveBeat.value = -1
  const ctx = getAudioContext()
  const now = ctx.currentTime
  const pattern = rhythmQuestion.value.pattern.beats

  pattern.forEach((beat, i) => {
    const t = now + i * STEP_DURATION
    if (beat === 2) {
      // accent
      playTone(220, t, STEP_DURATION * 0.8, 'square', 0.5)
    } else if (beat === 1) {
      playTone(180, t, STEP_DURATION * 0.8, 'square', 0.35)
    }
  })

  // Animate beat indicator
  let step = 0
  const tick = () => {
    if (step >= pattern.length) {
      rhythmIsPlaying.value = false
      rhythmActiveBeat.value = -1
      return
    }
    rhythmActiveBeat.value = step
    step++
    setTimeout(tick, STEP_DURATION * 1000)
  }
  tick()
}

function answerRhythm(choice) {
  if (rhythmAnswer.value) return
  rhythmAnswer.value = choice.name
  const correct = choice.name === rhythmQuestion.value.pattern.name
  rhythmFeedback.value = correct ? 'correct' : 'wrong'
  rhythmStats.value.total++
  if (correct) rhythmStats.value.correct++
}

// ── Note recognition state ────────────────────────────────────────────────────
const noteStats = ref(makeStats())
const noteQuestion = ref(null)   // { semitone }
const noteAnswer = ref(null)
const noteFeedback = ref(null)

function shuffledNoteChoices(correctSemitone) {
  const others = Array.from({ length: 12 }, (_, i) => i).filter(i => i !== correctSemitone)
  const shuffled = fisherYates(others).slice(0, 3)
  return fisherYates([...shuffled, correctSemitone])
    .map(s => ({ semitone: s, name: NOTE_NAMES[s] }))
}

function newNoteQuestion() {
  const semitone = Math.floor(Math.random() * 12)
  noteQuestion.value = { semitone, name: NOTE_NAMES[semitone], choices: shuffledNoteChoices(semitone) }
  noteAnswer.value = null
  noteFeedback.value = null
}

function playNote() {
  if (!noteQuestion.value) return
  const ctx = getAudioContext()
  const now = ctx.currentTime
  // Play the note in octave 3 (lower, more guitar-like)
  const freq = semitonesToFreq(noteQuestion.value.semitone) / 2
  playTone(freq, now, 2.5, 'sawtooth', 0.35)
}

function answerNote(choice) {
  if (noteAnswer.value) return
  noteAnswer.value = choice.name
  const correct = choice.semitone === noteQuestion.value.semitone
  noteFeedback.value = correct ? 'correct' : 'wrong'
  noteStats.value.total++
  if (correct) noteStats.value.correct++
}

// ── Exercise card metadata ─────────────────────────────────────────────────────
const exercises = [
  {
    id: 'interval',
    icon: '🎵',
    title: 'Interval Recognition',
    description: 'Two notes are played in sequence. Identify the interval between them.',
    difficulty: 'Intermediate',
    difficultyClass: 'diff-intermediate',
  },
  {
    id: 'chord',
    icon: '🎸',
    title: 'Chord Quality',
    description: 'A chord is played. Identify whether it is major, minor, diminished, augmented, or a 7th chord.',
    difficulty: 'Beginner',
    difficultyClass: 'diff-beginner',
  },
  {
    id: 'rhythm',
    icon: '🥁',
    title: 'Rhythm Training',
    description: 'A rhythmic pattern is played. Identify the pattern by listening carefully.',
    difficulty: 'Beginner',
    difficultyClass: 'diff-beginner',
  },
  {
    id: 'note',
    icon: '🎼',
    title: 'Note Recognition',
    description: 'A single note is played. Identify the note name by ear.',
    difficulty: 'Advanced',
    difficultyClass: 'diff-advanced',
  },
]

function openExercise(id) {
  activeExercise.value = id
  if (id === 'interval') newIntervalQuestion()
  if (id === 'chord') newChordQuestion()
  if (id === 'rhythm') newRhythmQuestion()
  if (id === 'note') newNoteQuestion()
}

function closeExercise() {
  activeExercise.value = null
}

const accuracyFor = (stats) => {
  if (stats.total === 0) return '—'
  return Math.round((stats.correct / stats.total) * 100) + '%'
}

const statsFor = computed(() => ({
  interval: intervalStats.value,
  chord: chordStats.value,
  rhythm: rhythmStats.value,
  note: noteStats.value,
}))
</script>

<template>
  <div class="ear-training-page">

    <!-- Exercise list view -->
    <template v-if="!activeExercise">
      <div class="page-header">
        <div>
          <h2 class="page-title">Ear Training</h2>
          <p class="page-subtitle">Train your ears to recognise intervals, chords, rhythms, and notes</p>
        </div>
      </div>

      <div class="exercise-cards">
        <div
          v-for="ex in exercises"
          :key="ex.id"
          class="et-card"
          @click="openExercise(ex.id)"
        >
          <div class="et-card-icon">{{ ex.icon }}</div>
          <div class="et-card-content">
            <div class="et-card-header">
              <span class="et-card-title">{{ ex.title }}</span>
              <span class="diff-badge" :class="ex.difficultyClass">{{ ex.difficulty }}</span>
            </div>
            <p class="et-card-desc">{{ ex.description }}</p>
            <div class="et-card-stats" v-if="statsFor[ex.id].total > 0">
              <span class="stat-item">✓ {{ statsFor[ex.id].correct }}/{{ statsFor[ex.id].total }}</span>
              <span class="stat-item accent">{{ accuracyFor(statsFor[ex.id]) }} accuracy</span>
            </div>
          </div>
          <div class="et-card-arrow">›</div>
        </div>
      </div>
    </template>

    <!-- ── Interval Exercise ────────────────────────────────────────── -->
    <template v-else-if="activeExercise === 'interval'">
      <div class="exercise-view">
        <div class="exercise-header">
          <button class="btn btn-secondary" @click="closeExercise">← Back</button>
          <div>
            <h2 class="page-title">🎵 Interval Recognition</h2>
            <p class="page-subtitle">Listen to two notes played in sequence and identify the interval</p>
          </div>
          <div class="score-badge">
            {{ intervalStats.correct }}/{{ intervalStats.total }}
            <span class="score-pct">{{ accuracyFor(intervalStats) }}</span>
          </div>
        </div>

        <div class="exercise-body" v-if="intervalQuestion">
          <div class="play-area">
            <button class="play-btn" @click="playInterval">
              ▶ Play Melodic
            </button>
            <button class="play-btn play-btn-secondary" @click="playIntervalHarmonic">
              ♩ Play Harmonic
            </button>
          </div>

          <div v-if="intervalFeedback" class="feedback" :class="intervalFeedback">
            <span v-if="intervalFeedback === 'correct'">✓ Correct! That was a <strong>{{ intervalQuestion.interval.name }}</strong> ({{ intervalQuestion.interval.abbr }})</span>
            <span v-else>✗ That was a <strong>{{ intervalQuestion.interval.name }}</strong> ({{ intervalQuestion.interval.abbr }})</span>
          </div>

          <div class="choices">
            <button
              v-for="choice in intervalQuestion.choices"
              :key="choice.name"
              class="choice-btn"
              :class="{
                selected: intervalAnswer === choice.name,
                correct: intervalAnswer && choice.name === intervalQuestion.interval.name,
                wrong: intervalAnswer === choice.name && intervalFeedback === 'wrong'
              }"
              :disabled="!!intervalAnswer"
              @click="answerInterval(choice)"
            >
              <span class="choice-abbr">{{ choice.abbr }}</span>
              <span class="choice-name">{{ choice.name }}</span>
            </button>
          </div>

          <div class="exercise-actions">
            <button class="btn btn-primary" @click="newIntervalQuestion">
              Next Question →
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Chord Quality Exercise ───────────────────────────────────── -->
    <template v-else-if="activeExercise === 'chord'">
      <div class="exercise-view">
        <div class="exercise-header">
          <button class="btn btn-secondary" @click="closeExercise">← Back</button>
          <div>
            <h2 class="page-title">🎸 Chord Quality</h2>
            <p class="page-subtitle">Listen to the chord and identify its quality</p>
          </div>
          <div class="score-badge">
            {{ chordStats.correct }}/{{ chordStats.total }}
            <span class="score-pct">{{ accuracyFor(chordStats) }}</span>
          </div>
        </div>

        <div class="exercise-body" v-if="chordQuestion">
          <div class="play-area">
            <button class="play-btn" @click="playChord">
              ▶ Play Chord
            </button>
            <button class="play-btn play-btn-secondary" @click="playChordBroken">
              ♩ Play Arpeggio
            </button>
          </div>

          <div v-if="chordFeedback" class="feedback" :class="chordFeedback">
            <span v-if="chordFeedback === 'correct'">✓ Correct! That was a <strong>{{ chordQuestion.quality.name }}</strong> chord</span>
            <span v-else>✗ That was a <strong>{{ chordQuestion.quality.name }}</strong> chord</span>
          </div>

          <div class="choices">
            <button
              v-for="choice in chordQuestion.choices"
              :key="choice.name"
              class="choice-btn"
              :class="{
                selected: chordAnswer === choice.name,
                correct: chordAnswer && choice.name === chordQuestion.quality.name,
                wrong: chordAnswer === choice.name && chordFeedback === 'wrong'
              }"
              :disabled="!!chordAnswer"
              @click="answerChord(choice)"
            >
              <span class="choice-abbr">{{ choice.symbol }}</span>
              <span class="choice-name">{{ choice.name }}</span>
            </button>
          </div>

          <div class="exercise-actions">
            <button class="btn btn-primary" @click="newChordQuestion">
              Next Question →
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Rhythm Exercise ──────────────────────────────────────────── -->
    <template v-else-if="activeExercise === 'rhythm'">
      <div class="exercise-view">
        <div class="exercise-header">
          <button class="btn btn-secondary" @click="closeExercise">← Back</button>
          <div>
            <h2 class="page-title">🥁 Rhythm Training</h2>
            <p class="page-subtitle">Listen to the rhythm and identify the pattern</p>
          </div>
          <div class="score-badge">
            {{ rhythmStats.correct }}/{{ rhythmStats.total }}
            <span class="score-pct">{{ accuracyFor(rhythmStats) }}</span>
          </div>
        </div>

        <div class="exercise-body" v-if="rhythmQuestion">
          <div class="play-area">
            <button class="play-btn" @click="playRhythm" :disabled="rhythmIsPlaying">
              <span v-if="rhythmIsPlaying">♩ Playing…</span>
              <span v-else>▶ Play Rhythm</span>
            </button>
          </div>

          <!-- Beat visualiser -->
          <div class="rhythm-grid">
            <div
              v-for="(beat, i) in rhythmQuestion.pattern.beats"
              :key="i"
              class="rhythm-step"
              :class="{
                'step-on': beat > 0,
                'step-accent': beat === 2,
                'step-active': rhythmActiveBeat === i
              }"
            ></div>
          </div>
          <div class="rhythm-labels">
            <template v-for="(beat, i) in rhythmQuestion.pattern.beats" :key="i">
              <span
                v-if="rhythmQuestion.pattern.labelPositions.includes(i)"
                class="rhythm-label"
              >{{ rhythmQuestion.pattern.labels[rhythmQuestion.pattern.labelPositions.indexOf(i)] }}</span>
              <span v-else class="rhythm-label-empty"></span>
            </template>
          </div>

          <div v-if="rhythmFeedback" class="feedback" :class="rhythmFeedback">
            <span v-if="rhythmFeedback === 'correct'">✓ Correct! That was <strong>{{ rhythmQuestion.pattern.name }}</strong></span>
            <span v-else>✗ That was <strong>{{ rhythmQuestion.pattern.name }}</strong> — {{ rhythmQuestion.pattern.description }}</span>
          </div>

          <div class="choices choices-vertical">
            <button
              v-for="choice in rhythmQuestion.choices"
              :key="choice.name"
              class="choice-btn choice-btn-wide"
              :class="{
                selected: rhythmAnswer === choice.name,
                correct: rhythmAnswer && choice.name === rhythmQuestion.pattern.name,
                wrong: rhythmAnswer === choice.name && rhythmFeedback === 'wrong'
              }"
              :disabled="!!rhythmAnswer"
              @click="answerRhythm(choice)"
            >
              <span class="choice-name">{{ choice.name }}</span>
              <span class="choice-desc">{{ choice.description }}</span>
            </button>
          </div>

          <div class="exercise-actions">
            <button class="btn btn-primary" @click="newRhythmQuestion">
              Next Question →
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Note Recognition Exercise ───────────────────────────────── -->
    <template v-else-if="activeExercise === 'note'">
      <div class="exercise-view">
        <div class="exercise-header">
          <button class="btn btn-secondary" @click="closeExercise">← Back</button>
          <div>
            <h2 class="page-title">🎼 Note Recognition</h2>
            <p class="page-subtitle">Listen to the note and identify it by name</p>
          </div>
          <div class="score-badge">
            {{ noteStats.correct }}/{{ noteStats.total }}
            <span class="score-pct">{{ accuracyFor(noteStats) }}</span>
          </div>
        </div>

        <div class="exercise-body" v-if="noteQuestion">
          <div class="play-area">
            <button class="play-btn" @click="playNote">
              ▶ Play Note
            </button>
          </div>

          <div v-if="noteFeedback" class="feedback" :class="noteFeedback">
            <span v-if="noteFeedback === 'correct'">✓ Correct! That was <strong>{{ noteQuestion.name }}</strong></span>
            <span v-else>✗ That was <strong>{{ noteQuestion.name }}</strong></span>
          </div>

          <div class="choices">
            <button
              v-for="choice in noteQuestion.choices"
              :key="choice.name"
              class="choice-btn"
              :class="{
                selected: noteAnswer === choice.name,
                correct: noteAnswer && choice.semitone === noteQuestion.semitone,
                wrong: noteAnswer === choice.name && noteFeedback === 'wrong'
              }"
              :disabled="!!noteAnswer"
              @click="answerNote(choice)"
            >
              <span class="choice-name note-name">{{ choice.name }}</span>
            </button>
          </div>

          <div class="exercise-actions">
            <button class="btn btn-primary" @click="newNoteQuestion">
              Next Question →
            </button>
          </div>
        </div>
      </div>
    </template>

  </div>
</template>

<style scoped>
.ear-training-page {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* ── Page header ────────────────────────────────────────────────── */
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

/* ── Exercise cards grid ────────────────────────────────────────── */
.exercise-cards {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.et-card {
  display: flex;
  align-items: center;
  gap: 20px;
  background: var(--surface, #1e1e1e);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px 24px;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}

.et-card:hover {
  border-color: var(--accent-green);
  box-shadow: 0 4px 24px rgba(76, 175, 80, 0.1);
  background: var(--bg-card-hover, #252525);
}

.et-card-icon {
  font-size: 2.2rem;
  flex-shrink: 0;
  line-height: 1;
}

.et-card-content {
  flex: 1;
  min-width: 0;
}

.et-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.et-card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
}

.diff-badge {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 3px 10px;
  border-radius: 20px;
}

.diff-beginner {
  background: rgba(76, 175, 80, 0.15);
  color: #4caf50;
}

.diff-intermediate {
  background: rgba(255, 179, 0, 0.15);
  color: #ffb300;
}

.diff-advanced {
  background: rgba(244, 67, 54, 0.15);
  color: #ef5350;
}

.et-card-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0;
}

.et-card-stats {
  display: flex;
  gap: 14px;
  margin-top: 8px;
}

.stat-item {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 600;
}

.stat-item.accent {
  color: var(--accent-green);
}

.et-card-arrow {
  font-size: 1.6rem;
  color: var(--text-muted);
  flex-shrink: 0;
  transition: color 0.2s, transform 0.2s;
}

.et-card:hover .et-card-arrow {
  color: var(--accent-green);
  transform: translateX(4px);
}

/* ── Active exercise view ───────────────────────────────────────── */
.exercise-view {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.exercise-header {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
}

.exercise-header > div {
  flex: 1;
  min-width: 0;
}

.score-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.3);
  border-radius: 12px;
  padding: 10px 18px;
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--accent-green);
  flex-shrink: 0;
  min-width: 80px;
  text-align: center;
}

.score-pct {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-top: 2px;
}

/* ── Exercise body ──────────────────────────────────────────────── */
.exercise-body {
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: var(--surface, #1e1e1e);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 32px;
}

.play-area {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.play-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 32px;
  background: var(--accent-green);
  color: #000;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.play-btn:hover:not(:disabled) {
  background: var(--accent-green-light, #66bb6a);
  transform: translateY(-1px);
}

.play-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.play-btn-secondary {
  background: transparent;
  color: var(--accent-green);
  border: 1px solid rgba(76, 175, 80, 0.4);
}

.play-btn-secondary:hover:not(:disabled) {
  background: rgba(76, 175, 80, 0.1);
}

/* ── Feedback ───────────────────────────────────────────────────── */
.feedback {
  padding: 14px 20px;
  border-radius: 10px;
  font-size: 0.95rem;
  text-align: center;
}

.feedback.correct {
  background: rgba(76, 175, 80, 0.12);
  border: 1px solid rgba(76, 175, 80, 0.4);
  color: #a5d6a7;
}

.feedback.wrong {
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.3);
  color: #ef9a9a;
}

/* ── Choices ────────────────────────────────────────────────────── */
.choices {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.choices-vertical {
  grid-template-columns: 1fr;
}

.choice-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 12px;
  background: var(--bg-secondary, #1a1a1a);
  border: 2px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, transform 0.1s;
  color: var(--text-primary);
}

.choice-btn:hover:not(:disabled) {
  border-color: var(--accent-amber, #ffb300);
  background: rgba(255, 179, 0, 0.05);
  transform: translateY(-1px);
}

.choice-btn:disabled {
  cursor: default;
}

.choice-btn.correct {
  border-color: var(--accent-green) !important;
  background: rgba(76, 175, 80, 0.12) !important;
}

.choice-btn.wrong {
  border-color: #f44336 !important;
  background: rgba(244, 67, 54, 0.1) !important;
}

.choice-abbr {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
}

.choice-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.note-name {
  font-size: 1.4rem;
}

.choice-btn-wide {
  flex-direction: row;
  justify-content: flex-start;
  gap: 14px;
  padding: 14px 20px;
}

.choice-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-align: left;
}

/* ── Rhythm grid ────────────────────────────────────────────────── */
.rhythm-grid {
  display: flex;
  gap: 5px;
  justify-content: center;
  flex-wrap: nowrap;
}

.rhythm-step {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: var(--bg-secondary, #1a1a1a);
  border: 1px solid var(--border);
  flex-shrink: 0;
  transition: background 0.08s;
}

.rhythm-step.step-on {
  background: rgba(76, 175, 80, 0.25);
  border-color: var(--accent-green);
}

.rhythm-step.step-accent {
  background: rgba(255, 179, 0, 0.3);
  border-color: var(--accent-amber, #ffb300);
}

.rhythm-step.step-active {
  background: var(--accent-green) !important;
  border-color: var(--accent-green-light, #66bb6a) !important;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.6);
}

.rhythm-labels {
  display: flex;
  gap: 5px;
  justify-content: center;
}

.rhythm-label,
.rhythm-label-empty {
  width: 40px;
  text-align: center;
  font-size: 0.7rem;
  color: var(--text-muted);
  font-weight: 600;
  flex-shrink: 0;
}

/* ── Actions ────────────────────────────────────────────────────── */
.exercise-actions {
  display: flex;
  justify-content: center;
}
</style>
