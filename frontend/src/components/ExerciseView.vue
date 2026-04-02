<script setup>
import { ref, computed, onUnmounted } from 'vue'
import ChordDiagram from './ChordDiagram.vue'
import { RELATED_CHORDS, CHORD_VOICINGS } from '../data/chordData.js'

const props = defineProps({ exercise: { type: Object, required: true } })
const emit = defineEmits(['back', 'customize'])

// ── Music theory constants ────────────────────────────────────────────────────
const NOTE_TO_ST = { C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11 }
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
const SCALE_INTERVALS = {
  major:           [0,2,4,5,7,9,11],
  minor:           [0,2,3,5,7,8,10],
  pentatonic_minor:[0,3,5,7,10],
  pentatonic_major:[0,2,4,7,9],
  blues:           [0,3,5,6,7,10]
}
const SCALE_LABELS = {
  major:'Major', minor:'Minor',
  pentatonic_minor:'Pentatonic Minor', pentatonic_major:'Pentatonic Major',
  blues:'Blues'
}
// String index 0 = high e, index 5 = low E
const STRING_MIDI   = [64, 59, 55, 50, 45, 40]
const STRING_LABELS = ['e', 'B', 'G', 'D', 'A', 'E']
const TYPE_LABELS   = { scale:'Scale', chords:'Chords', fingerpicking:'Fingerpicking', barre:'Barre' }

// ── Tab data (scale exercises only) ──────────────────────────────────────────
const tabData = computed(() => {
  if (props.exercise.type !== 'scale') return null
  const { rootNote, scaleType, positions } = props.exercise.settings
  const pos       = Array.isArray(positions) ? positions[0] : (positions ?? 1)
  const startFret = Math.max(0, pos - 1)
  const endFret   = startFret + 5
  const root      = NOTE_TO_ST[rootNote] ?? 0
  const intervals = SCALE_INTERVALS[scaleType] ?? SCALE_INTERVALS.major
  const scaleSet  = new Set(intervals.map(i => (root + i) % 12))
  const frets     = Array.from({ length: endFret - startFret + 1 }, (_, i) => startFret + i)

  const grid = STRING_MIDI.map((openMidi, si) =>
    frets.map(fret => {
      const midi = openMidi + fret
      const nc   = midi % 12
      return { fret, midi, inScale: scaleSet.has(nc), isRoot: nc === root }
    })
  )

  // Play sequence: string 5→0 (low E to high e), ascending fret on each string
  const seq = []
  for (let si = 5; si >= 0; si--) {
    for (const fret of frets) {
      const midi = STRING_MIDI[si] + fret
      if (scaleSet.has(midi % 12)) seq.push({ si, fret, midi })
    }
  }

  return { grid, seq, frets }
})

// ── Audio engine ─────────────────────────────────────────────────────────────
let audioCtx      = null
let schedulerTimer = null
let nextBeatTime   = 0
let _beatIdx       = 0
let _noteIdx       = 0

const isPlaying    = ref(false)
const isMetronome  = ref(false)
const currentNoteIdx = ref(-1)
const beatCount    = ref(0)

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

function midiToFreq(midi) { return 440 * Math.pow(2, (midi - 69) / 12) }
function midiToName(midi) { return NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1) }

function emitClick(ctx, time, accent) {
  const osc = ctx.createOscillator()
  const g   = ctx.createGain()
  osc.connect(g)
  g.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.value = accent ? 1400 : 900
  g.gain.setValueAtTime(accent ? 0.5 : 0.25, time)
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.05)
  osc.start(time)
  osc.stop(time + 0.06)
}

function emitTone(ctx, midi, time, dur) {
  const osc = ctx.createOscillator()
  const g   = ctx.createGain()
  osc.connect(g)
  g.connect(ctx.destination)
  osc.type = 'triangle'
  osc.frequency.value = midiToFreq(midi)
  g.gain.setValueAtTime(0.3, time)
  g.gain.setTargetAtTime(0, time + dur * 0.4, dur * 0.15)
  osc.start(time)
  osc.stop(time + dur)
}

function schedule() {
  if (!audioCtx) return
  const ctx = audioCtx
  // Seconds per beat at the current tempo
  const beatDuration = 60 / (props.exercise.settings.tempo ?? 60)
  const seq = tabData.value?.seq

  // Schedule up to 200ms ahead — standard Web Audio lookahead to avoid gaps
  while (nextBeatTime < ctx.currentTime + 0.2) {
    const beatTime  = nextBeatTime
    const beatIndex = _beatIdx
    const noteIndex = _noteIdx
    const delay = Math.max(0, (beatTime - ctx.currentTime) * 1000)

    if (isMetronome.value) emitClick(ctx, beatTime, beatIndex % 4 === 0)

    if (isPlaying.value && seq && seq.length > 0) {
      const note           = seq[noteIndex % seq.length]
      const capturedNoteIdx = noteIndex % seq.length
      emitTone(ctx, note.midi, beatTime, beatDuration * 0.75)
      setTimeout(() => {
        if (isPlaying.value) currentNoteIdx.value = capturedNoteIdx
      }, delay)
      _noteIdx++
    }

    const capturedBeatIdx = beatIndex
    setTimeout(() => { beatCount.value = capturedBeatIdx }, delay)
    _beatIdx++
    nextBeatTime += beatDuration
  }
}

function startEngine() {
  if (schedulerTimer) return
  const ctx = getCtx()
  _beatIdx     = 0
  nextBeatTime = ctx.currentTime + 0.05
  // Poll every 25ms — standard Web Audio scheduling interval for smooth playback
  schedulerTimer = setInterval(schedule, 25)
}

function stopEngine() {
  clearInterval(schedulerTimer)
  schedulerTimer  = null
  currentNoteIdx.value = -1
  beatCount.value = 0
}

function toggleMetronome() {
  isMetronome.value = !isMetronome.value
  if (isMetronome.value) {
    startEngine()
  } else if (!isPlaying.value) {
    stopEngine()
  }
}

function togglePlay() {
  if (isPlaying.value) {
    isPlaying.value = false
    currentNoteIdx.value = -1
    if (!isMetronome.value) stopEngine()
  } else {
    _noteIdx = 0
    isPlaying.value = true
    startEngine()
  }
}

function playSingleNote(midi) {
  const ctx = getCtx()
  emitTone(ctx, midi, ctx.currentTime + 0.01, 0.8)
}

function isNoteActive(si, fret) {
  if (!isPlaying.value || currentNoteIdx.value < 0 || !tabData.value) return false
  const n = tabData.value.seq[currentNoteIdx.value]
  return n && n.si === si && n.fret === fret
}

const currentChordIdx = computed(() => {
  if (props.exercise.type !== 'chords') return -1
  if (!isMetronome.value && !isPlaying.value) return -1
  const chords = props.exercise.settings.chords
  if (!chords?.length) return -1
  const bpc = props.exercise.settings.beatsPerChord ?? 4
  return Math.floor(beatCount.value / bpc) % chords.length
})

const currentNoteInfo = computed(() => {
  if (!isPlaying.value || currentNoteIdx.value < 0 || !tabData.value) return ''
  const note = tabData.value.seq[currentNoteIdx.value]
  return note ? midiToName(note.midi) : ''
})

// Unique related chords that aren't already in the exercise progression
const relatedChords = computed(() => {
  if (props.exercise.type !== 'chords') return []
  const inSequence = new Set(props.exercise.settings.chords ?? [])
  const seen = new Set()
  const result = []
  for (const chord of inSequence) {
    for (const rel of (RELATED_CHORDS[chord] ?? [])) {
      if (!inSequence.has(rel) && !seen.has(rel) && CHORD_VOICINGS[rel]) {
        seen.add(rel)
        result.push(rel)
      }
    }
  }
  return result.slice(0, 6)
})

onUnmounted(() => {
  stopEngine()
  audioCtx?.close()
})
</script>

<template>
  <div class="exercise-view">

    <!-- Header card -->
    <div class="view-card view-header-card">
      <div class="view-meta">
        <span :class="['badge', `badge-${exercise.type}`]">
          {{ TYPE_LABELS[exercise.type] || exercise.type }}
        </span>
        <h2 class="view-title">{{ exercise.name }}</h2>
        <p class="view-desc">{{ exercise.description }}</p>
      </div>
      <button class="btn btn-secondary btn-customize" @click="emit('customize', exercise)">
        ✎ Customize
      </button>
    </div>

    <!-- Fretboard tab (scale exercises) -->
    <div v-if="tabData" class="view-card">
      <div class="section-header">
        <h3 class="section-title">
          {{ exercise.settings.rootNote }} {{ SCALE_LABELS[exercise.settings.scaleType] }} Scale
        </h3>
        <span class="section-hint">Click a note to hear it</span>
      </div>

      <div class="fretboard">
        <!-- Fret number header -->
        <div class="fb-row fb-header">
          <span class="fb-label"></span>
          <div class="fb-cells">
            <div v-for="f in tabData.frets" :key="f" class="fb-cell">
              <span class="fret-num">{{ f }}</span>
            </div>
          </div>
        </div>

        <!-- String rows -->
        <div v-for="(cells, si) in tabData.grid" :key="si" class="fb-row">
          <span class="fb-label">{{ STRING_LABELS[si] }}</span>
          <div class="fb-cells">
            <div v-for="cell in cells" :key="cell.fret" class="fb-cell">
              <button
                v-if="cell.inScale"
                :class="['note-dot', { 'note-root': cell.isRoot, 'note-active': isNoteActive(si, cell.fret) }]"
                @click="playSingleNote(cell.midi)"
                :title="midiToName(cell.midi)"
              >{{ cell.fret }}</button>
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div class="fb-legend">
          <span class="legend-item">
            <span class="legend-dot"></span> Scale note
          </span>
          <span class="legend-item">
            <span class="legend-dot legend-root"></span> Root note
          </span>
          <span class="legend-item">
            <span class="legend-dot legend-active"></span> Playing
          </span>
        </div>
      </div>
    </div>

    <!-- Chord sequence display -->
    <div v-else-if="exercise.type === 'chords'" class="view-card">
      <h3 class="section-title" style="margin-bottom:16px">Chord Sequence</h3>
      <div class="chord-sequence">
        <div
          v-for="(chord, i) in exercise.settings.chords"
          :key="i"
          :class="['chord-box', { 'chord-active': currentChordIdx === i }]"
        >
          <span class="chord-name">{{ chord }}</span>
          <span class="chord-beats">{{ exercise.settings.beatsPerChord }} beats</span>
        </div>
      </div>
    </div>

    <!-- Chord diagrams on fretboard (chords exercise) -->
    <div v-if="exercise.type === 'chords'" class="view-card">
      <div class="section-header">
        <h3 class="section-title">Chord Diagrams</h3>
        <span class="section-hint">Tap a voicing tab to see inversions</span>
      </div>
      <div class="chord-diagrams-row">
        <ChordDiagram
          v-for="(chord, i) in exercise.settings.chords"
          :key="chord + i"
          :chord="chord"
          :active="currentChordIdx === i"
        />
      </div>
    </div>

    <!-- Related chords that go well together (chords exercise) -->
    <div v-if="exercise.type === 'chords' && relatedChords.length" class="view-card">
      <div class="section-header">
        <h3 class="section-title">Chords That Go Well Together</h3>
        <span class="section-hint">Common companions for this progression</span>
      </div>
      <div class="chord-diagrams-row">
        <ChordDiagram
          v-for="chord in relatedChords"
          :key="chord"
          :chord="chord"
        />
      </div>
    </div>

    <!-- Fingerpicking / Barre info -->
    <div v-if="exercise.type === 'fingerpicking' || exercise.type === 'barre'" class="view-card">
      <h3 class="section-title" style="margin-bottom:12px">Exercise Details</h3>
      <div v-if="exercise.type === 'fingerpicking'" class="detail-row">
        <span class="detail-label">Pattern</span>
        <span class="detail-value pattern-text">{{ exercise.settings.pattern }}</span>
      </div>
      <div v-else-if="exercise.type === 'barre'" class="detail-row">
        <span class="detail-label">Chord</span>
        <span class="detail-value chord-big">{{ exercise.settings.chord }}</span>
        <span class="detail-label" style="margin-left:20px">Reps</span>
        <span class="detail-value">× {{ exercise.settings.repetitions }}</span>
      </div>
    </div>

    <!-- Controls -->
    <div class="view-card controls-card">
      <div class="tempo-display">
        <span class="tempo-num">{{ exercise.settings.tempo }}</span>
        <span class="tempo-label">BPM</span>
      </div>

      <div class="ctrl-buttons">
        <button
          :class="['btn', 'ctrl-btn', isMetronome ? 'btn-primary' : 'btn-secondary']"
          @click="toggleMetronome"
        >
          {{ isMetronome ? '⏸ Metronome On' : '🎵 Metronome' }}
        </button>
        <button
          v-if="tabData"
          :class="['btn', 'ctrl-btn', isPlaying ? 'btn-danger' : 'btn-amber']"
          @click="togglePlay"
        >
          {{ isPlaying ? '■ Stop' : '▶ Play Scale' }}
        </button>
      </div>

      <div v-if="currentNoteInfo" class="status-bar status-note">
        ♩ {{ currentNoteInfo }}
      </div>
      <div v-else-if="isMetronome || isPlaying" class="status-bar status-beat">
        Beat {{ (beatCount % 4) + 1 }}
      </div>
    </div>

  </div>
</template>

<style scoped>
.exercise-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 820px;
}

/* ── Card shell ── */
.view-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px 28px;
  position: relative;
  overflow: hidden;
}
.view-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--accent-green), var(--accent-amber));
}

/* ── Header card ── */
.view-header-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}
.view-meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.view-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
}
.view-desc {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.6;
}
.btn-customize {
  flex-shrink: 0;
  margin-top: 4px;
}

/* ── Section header ── */
.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 20px;
}
.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}
.section-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* ── Fretboard ── */
.fretboard {
  overflow-x: auto;
  padding-bottom: 4px;
}
.fb-row {
  display: flex;
  align-items: center;
}
.fb-header { margin-bottom: 2px; }
.fb-label {
  width: 22px;
  flex-shrink: 0;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  font-style: italic;
}
.fb-cells {
  display: flex;
  flex: 1;
}
.fb-cell {
  flex: 1;
  min-width: 52px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* String wire */
.fb-row:not(.fb-header) .fb-cell::before {
  content: '';
  position: absolute;
  left: 0; right: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 1px;
  background: var(--border-accent);
  pointer-events: none;
}
/* Fret bar */
.fb-row:not(.fb-header) .fb-cell::after {
  content: '';
  position: absolute;
  right: 0;
  top: 18%;
  height: 64%;
  width: 1px;
  background: var(--border);
  pointer-events: none;
}

.fret-num {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-family: monospace;
}

/* ── Note dots ── */
.note-dot {
  position: relative;
  z-index: 1;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-secondary);
  border: 2px solid var(--accent-green);
  color: var(--accent-green);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease, background 0.1s ease;
  padding: 0;
  line-height: 1;
}
.note-dot:hover {
  background: rgba(76,175,80,0.2);
  transform: scale(1.1);
}
.note-dot.note-root {
  background: var(--accent-green);
  color: #000;
}
.note-dot.note-root:hover {
  background: var(--accent-green-light);
}
.note-dot.note-active {
  background: var(--accent-amber) !important;
  border-color: var(--accent-amber) !important;
  color: #000 !important;
  box-shadow: 0 0 14px rgba(255,179,0,0.75);
  transform: scale(1.22) !important;
}

/* ── Legend ── */
.fb-legend {
  display: flex;
  gap: 20px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  color: var(--text-muted);
}
.legend-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: inline-block;
  background: var(--bg-secondary);
  border: 2px solid var(--accent-green);
  flex-shrink: 0;
}
.legend-dot.legend-root {
  background: var(--accent-green);
  border-color: var(--accent-green);
}
.legend-dot.legend-active {
  background: var(--accent-amber);
  border-color: var(--accent-amber);
}

/* ── Chord sequence ── */
.chord-sequence {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

/* ── Chord diagrams row ── */
.chord-diagrams-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}
.chord-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-accent);
  border-radius: var(--radius);
  padding: 16px 24px;
  min-width: 72px;
  transition: all 0.15s ease;
}
.chord-box.chord-active {
  border-color: var(--accent-amber);
  background: rgba(255,179,0,0.1);
  box-shadow: 0 0 14px rgba(255,179,0,0.35);
}
.chord-name {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-primary);
}
.chord-box.chord-active .chord-name {
  color: var(--accent-amber);
}
.chord-beats {
  font-size: 0.65rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ── Details (fingerpicking / barre) ── */
.detail-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.detail-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-muted);
}
.detail-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}
.pattern-text {
  font-family: monospace;
  font-size: 1.1rem;
  color: var(--accent-amber);
  letter-spacing: 2px;
}
.chord-big {
  font-size: 1.6rem;
  color: var(--accent-green);
}

/* ── Controls card ── */
.controls-card {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}
.tempo-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border-accent);
  border-radius: var(--radius-sm);
  padding: 10px 18px;
  min-width: 72px;
}
.tempo-num {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--accent-amber);
  line-height: 1;
}
.tempo-label {
  font-size: 0.65rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 2px;
}
.ctrl-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.ctrl-btn {
  min-width: 150px;
  justify-content: center;
}
.status-bar {
  margin-left: auto;
  font-size: 0.875rem;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: var(--radius-sm);
}
.status-note {
  background: rgba(255,179,0,0.12);
  border: 1px solid rgba(255,179,0,0.3);
  color: var(--accent-amber);
}
.status-beat {
  background: rgba(76,175,80,0.1);
  border: 1px solid rgba(76,175,80,0.25);
  color: var(--accent-green);
}
</style>
