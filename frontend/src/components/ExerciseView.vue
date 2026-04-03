<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import ChordDiagram from './ChordDiagram.vue'
import { RELATED_CHORDS, CHORD_VOICINGS } from '../data/chordData.js'

const props = defineProps({ exercise: { type: Object, required: true } })
const emit = defineEmits(['back', 'customize'])

// ── Music theory constants ────────────────────────────────────────────────────
const NOTE_TO_ST = { C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11 }
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
const SCALE_INTERVALS = {
  major:            [0,2,4,5,7,9,11],
  minor:            [0,2,3,5,7,8,10],
  pentatonic_minor: [0,3,5,7,10],
  pentatonic_major: [0,2,4,7,9],
  blues:            [0,3,5,6,7,10],
  dorian:           [0,2,3,5,7,9,10],
  phrygian:         [0,1,3,5,7,8,10],
  lydian:           [0,2,4,6,7,9,11],
  mixolydian:       [0,2,4,5,7,9,10],
  locrian:          [0,1,3,5,6,8,10],
  harmonic_minor:   [0,2,3,5,7,8,11],
  melodic_minor:    [0,2,3,5,7,9,11],
  whole_tone:       [0,2,4,6,8,10],
  diminished:       [0,1,3,4,6,7,9,10],
  hungarian_minor:  [0,2,3,6,7,8,11]
}
const SCALE_LABELS = {
  major:'Major', minor:'Minor',
  pentatonic_minor:'Pentatonic Minor', pentatonic_major:'Pentatonic Major',
  blues:'Blues',
  dorian:'Dorian', phrygian:'Phrygian', lydian:'Lydian',
  mixolydian:'Mixolydian', locrian:'Locrian',
  harmonic_minor:'Harmonic Minor', melodic_minor:'Melodic Minor',
  whole_tone:'Whole Tone', diminished:'Diminished', hungarian_minor:'Hungarian Minor'
}
// String index 0 = high e, index 5 = low E
const STRING_MIDI   = [64, 59, 55, 50, 45, 40]
const STRING_LABELS = ['e', 'B', 'G', 'D', 'A', 'E']
const TYPE_LABELS   = { scale:'Scale', chords:'Chords', fingerpicking:'Fingerpicking', barre:'Barre' }
const DURATION_OPTIONS = [
  { label: 'Whole',   value: 4    },
  { label: 'Half',    value: 2    },
  { label: 'Quarter', value: 1    },
  { label: 'Eighth',  value: 0.5  },
  { label: '16th',    value: 0.25 },
]

// ── Box (position) navigation ─────────────────────────────────────────────────
const boxStart = ref(0)

watch(
  () => props.exercise.settings?.positions,
  (p) => {
    const pos = Array.isArray(p) ? p[0] : (p ?? 1)
    boxStart.value = Math.max(0, pos - 1)
  },
  { immediate: true }
)

function prevBox() { if (boxStart.value > 0) { boxStart.value = Math.max(0, boxStart.value - 2) } }
function nextBox() { boxStart.value += 2 }

// ── Tab data (scale exercises only) ──────────────────────────────────────────
const tabData = computed(() => {
  if (props.exercise.type !== 'scale') return null
  const { rootNote, scaleType } = props.exercise.settings
  const startFret = boxStart.value
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

  // Play sequence: string 5→0 (low E to high e), ascending fret; skip duplicate MIDI pitches
  const seenMidi = new Set()
  const seq = []
  for (let si = 5; si >= 0; si--) {
    for (const fret of frets) {
      const midi = STRING_MIDI[si] + fret
      if (scaleSet.has(midi % 12) && !seenMidi.has(midi)) {
        seenMidi.add(midi)
        seq.push({ si, fret, midi })
      }
    }
  }

  return { grid, seq, frets }
})

// ── Audio engine ─────────────────────────────────────────────────────────────
let audioCtx      = null
let schedulerTimer = null
let nextBeatTime   = 0
let _nextNoteTime  = 0
let _beatIdx       = 0
let _noteIdx       = 0

const isPlaying    = ref(false)
const isMetronome  = ref(false)
const currentNoteIdx = ref(-1)
const beatCount    = ref(0)
const metronomeVolume = ref(100)
const scaleVolume  = ref(100)
const localTempo   = ref(props.exercise.settings.tempo ?? 60)
const noteDurations = ref([])
const defaultNoteDuration = ref(1)

watch(
  () => props.exercise.settings.tempo,
  t => { localTempo.value = t ?? 60 }
)

watch(tabData, (td) => {
  if (td) {
    const len = td.seq.length
    if (noteDurations.value.length !== len) {
      noteDurations.value = Array(len).fill(defaultNoteDuration.value)
    }
  }
}, { immediate: true })

function setAllDurations(val) {
  defaultNoteDuration.value = val
  noteDurations.value = Array(noteDurations.value.length).fill(val)
}

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
  const vol = metronomeVolume.value / 100
  g.gain.setValueAtTime((accent ? 0.5 : 0.25) * vol, time)
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
  const vol = scaleVolume.value / 100
  g.gain.setValueAtTime(0.3 * vol, time)
  g.gain.setTargetAtTime(0, time + dur * 0.4, dur * 0.15)
  osc.start(time)
  osc.stop(time + dur)
}

function schedule() {
  if (!audioCtx) return
  const ctx = audioCtx
  // Seconds per beat at the current tempo
  const beatDuration = 60 / localTempo.value
  const seq = tabData.value?.seq

  // Schedule metronome ticks (beat-aligned)
  // Standard Web Audio lookahead of 200ms to avoid gaps
  while (nextBeatTime < ctx.currentTime + 0.2) {
    const beatTime  = nextBeatTime
    const beatIndex = _beatIdx
    const delay = Math.max(0, (beatTime - ctx.currentTime) * 1000)

    if (isMetronome.value) emitClick(ctx, beatTime, beatIndex % 4 === 0)

    const capturedBeatIdx = beatIndex
    setTimeout(() => { beatCount.value = capturedBeatIdx }, delay)
    _beatIdx++
    nextBeatTime += beatDuration
  }

  // Schedule scale notes (duration-aligned, independent of metronome ticks)
  if (isPlaying.value && seq && seq.length > 0) {
    while (_nextNoteTime < ctx.currentTime + 0.2) {
      const noteTime = _nextNoteTime
      const noteIndex = _noteIdx % seq.length
      const note = seq[noteIndex]
      const dur = noteDurations.value[noteIndex] ?? defaultNoteDuration.value
      const toneDur = beatDuration * dur * 0.9
      const delay = Math.max(0, (noteTime - ctx.currentTime) * 1000)

      emitTone(ctx, note.midi, noteTime, toneDur)
      const capturedNoteIdx = noteIndex
      setTimeout(() => {
        if (isPlaying.value) currentNoteIdx.value = capturedNoteIdx
      }, delay)
      _noteIdx++
      _nextNoteTime += beatDuration * dur
    }
  }
}

function startEngine() {
  if (schedulerTimer) return
  const ctx = getCtx()
  _beatIdx      = 0
  _noteIdx      = 0
  nextBeatTime  = ctx.currentTime + 0.05
  _nextNoteTime = ctx.currentTime + 0.05
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
    _nextNoteTime = audioCtx ? audioCtx.currentTime + 0.05 : 0
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
        <div class="box-nav">
          <button class="btn btn-secondary btn-box-nav" @click="prevBox" :disabled="boxStart === 0" title="Previous box">◀</button>
          <span class="box-label">Frets {{ tabData.frets[0] }}–{{ tabData.frets[tabData.frets.length - 1] }}</span>
          <button class="btn btn-secondary btn-box-nav" @click="nextBox" title="Next box">▶</button>
        </div>
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

    <!-- Note durations (scale exercises) -->
    <div v-if="tabData" class="view-card">
      <div class="section-header">
        <h3 class="section-title">Note Durations</h3>
        <div class="duration-all-ctrl">
          <label class="slider-label">Set All</label>
          <select :value="defaultNoteDuration" @change="setAllDurations(+$event.target.value)" class="duration-select-all">
            <option v-for="d in DURATION_OPTIONS" :key="d.value" :value="d.value">{{ d.label }}</option>
          </select>
        </div>
      </div>
      <div class="duration-notes-row">
        <div v-for="(note, i) in tabData.seq" :key="i" class="duration-note-item">
          <span class="duration-note-name">{{ midiToName(note.midi) }}</span>
          <select :value="noteDurations[i]" @change="noteDurations[i] = +$event.target.value" class="duration-select">
            <option v-for="d in DURATION_OPTIONS" :key="d.value" :value="d.value">{{ d.label }}</option>
          </select>
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
      <div class="controls-row">
        <div class="tempo-display">
          <span class="tempo-num">{{ localTempo }}</span>
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

      <div class="controls-sliders">
        <div class="slider-group">
          <label for="speed-slider" class="slider-label">Speed</label>
          <input id="speed-slider" type="range" v-model.number="localTempo" min="40" max="200" step="1" class="ctrl-slider" />
          <span class="slider-value">{{ localTempo }} BPM</span>
        </div>
        <div class="slider-group">
          <label for="metronome-vol-slider" class="slider-label">Metronome</label>
          <input id="metronome-vol-slider" type="range" v-model.number="metronomeVolume" min="0" max="100" step="1" class="ctrl-slider" />
          <span class="slider-value">{{ metronomeVolume }}%</span>
        </div>
        <div class="slider-group">
          <label for="scale-vol-slider" class="slider-label">Scale</label>
          <input id="scale-vol-slider" type="range" v-model.number="scaleVolume" min="0" max="100" step="1" class="ctrl-slider" />
          <span class="slider-value">{{ scaleVolume }}%</span>
        </div>
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
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
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

/* ── Box navigation ── */
.box-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-box-nav {
  padding: 4px 10px;
  font-size: 0.8rem;
  line-height: 1;
}
.box-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  min-width: 72px;
  text-align: center;
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
  flex-direction: column;
  gap: 16px;
}
.controls-row {
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

/* ── Sliders ── */
.controls-sliders {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}
.slider-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 200px;
}
.slider-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-muted);
  min-width: 50px;
}
.ctrl-slider {
  flex: 1;
  accent-color: var(--accent-amber);
  cursor: pointer;
  height: 4px;
}
.slider-value {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--accent-amber);
  min-width: 60px;
  text-align: right;
}

/* ── Note durations ── */
.duration-all-ctrl {
  display: flex;
  align-items: center;
  gap: 8px;
}
.duration-select-all {
  background: var(--bg-secondary);
  border: 1px solid var(--border-accent);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  padding: 4px 8px;
  font-size: 0.8rem;
  cursor: pointer;
}
.duration-notes-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.duration-note-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 6px 8px;
  min-width: 52px;
}
.duration-note-name {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-primary);
}
.duration-select {
  background: var(--bg-secondary);
  border: 1px solid var(--border-accent);
  border-radius: 4px;
  color: var(--accent-amber);
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 4px;
  cursor: pointer;
  width: 100%;
}
</style>
