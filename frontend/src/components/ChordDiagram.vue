<script setup>
import { ref, computed } from 'vue'
import { CHORD_VOICINGS } from '../data/chordData.js'

const props = defineProps({
  chord:  { type: String,  required: true },
  active: { type: Boolean, default: false },
})

const selectedVoicing = ref(0)

const voicings   = computed(() => CHORD_VOICINGS[props.chord] ?? null)
const current    = computed(() => voicings.value?.[selectedVoicing.value] ?? null)
const startFret  = computed(() => current.value?.startFret ?? 1)
const showNut    = computed(() => startFret.value === 1)

// SVG coordinate constants
const STRING_X = [10, 26, 42, 58, 74, 90]  // x pos per string (low E → high e)
const DOT_Y    = [40, 60, 80, 100]          // y center of fret bands 1–4

// Finger dots: each pressed string maps to a grid position (0-indexed)
const dots = computed(() => {
  if (!current.value) return []
  return current.value.frets.flatMap((f, si) => {
    if (f <= 0) return []
    const gp = f - startFret.value   // 0 = top band of grid
    if (gp < 0 || gp > 3) return []
    return [{ si, gp }]
  })
})

// Open (○) / muted (×) markers above nut – only for strings with no dot
const dotStrings = computed(() => new Set(dots.value.map(d => d.si)))
const markers = computed(() => {
  if (!current.value) return STRING_X.map(() => '')
  return current.value.frets.map((f, si) => {
    if (dotStrings.value.has(si)) return ''
    if (f === -1) return '×'
    if (f === 0)  return '○'
    return ''
  })
})

// Tab lines: high e (si=5) at top, low E (si=0) at bottom – order matches standard tab notation
const TAB_STRING_LABELS = ['e', 'B', 'G', 'D', 'A', 'E']
const tabLines = computed(() => {
  if (!current.value) return []
  return [5, 4, 3, 2, 1, 0].map((si, li) => {
    const f    = current.value.frets[si]
    const fStr = f === -1 ? 'x' : String(f)
    const inner = fStr.length > 1 ? `-${fStr}--` : `--${fStr}--`
    return `${TAB_STRING_LABELS[li]}|${inner}|`
  })
})
</script>

<template>
  <div :class="['chord-diagram', { 'cd-active': active }]">

    <!-- Chord name -->
    <div class="cd-chord-name">{{ chord }}</div>

    <!-- Voicing selector tabs -->
    <div v-if="voicings" class="cd-voicing-tabs">
      <button
        v-for="(v, i) in voicings"
        :key="i"
        :class="['cd-tab-btn', { 'cd-tab-active': selectedVoicing === i }]"
        @click="selectedVoicing = i"
      >{{ v.label }}</button>
    </div>

    <!-- SVG chord box diagram -->
    <div v-if="current" class="cd-svg-wrap">
      <svg viewBox="0 0 110 120" xmlns="http://www.w3.org/2000/svg" class="cd-svg">

        <!-- Open / muted markers above grid -->
        <text
          v-for="(marker, i) in markers"
          :key="`m${i}`"
          :x="STRING_X[i]"
          y="20"
          text-anchor="middle"
          class="cd-marker"
        >{{ marker }}</text>

        <!-- Nut (thick bar, open-position chords only) -->
        <rect v-if="showNut" x="8" y="27" width="84" height="5" class="cd-nut" />
        <!-- Top fret line (barre chords) -->
        <line v-else :x1="STRING_X[0]" y1="30" :x2="STRING_X[5]" y2="30" class="cd-fret" />

        <!-- String lines (vertical) -->
        <line
          v-for="(x, i) in STRING_X"
          :key="`s${i}`"
          :x1="x" y1="30" :x2="x" y2="110"
          class="cd-string"
        />

        <!-- Fret lines (horizontal) -->
        <line
          v-for="y in [50, 70, 90, 110]"
          :key="`f${y}`"
          :x1="STRING_X[0]" :y1="y" :x2="STRING_X[5]" :y2="y"
          class="cd-fret"
        />

        <!-- Finger dots -->
        <circle
          v-for="dot in dots"
          :key="`d${dot.si}-${dot.gp}`"
          :cx="STRING_X[dot.si]"
          :cy="DOT_Y[dot.gp]"
          r="8"
          class="cd-dot"
        />

        <!-- Fret position label for barre chords (e.g. "5fr") -->
        <text v-if="!showNut" x="100" y="44" class="cd-fret-label">{{ startFret }}fr</text>

      </svg>
    </div>

    <!-- Tab notation -->
    <div v-if="current" class="cd-tab">
      <div v-for="(line, i) in tabLines" :key="i" class="cd-tab-line">{{ line }}</div>
    </div>

    <!-- Fallback when chord is not in database -->
    <div v-else class="cd-no-data">No diagram</div>

  </div>
</template>

<style scoped>
.chord-diagram {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-accent);
  border-radius: var(--radius);
  padding: 12px 10px 10px;
  min-width: 118px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}
.chord-diagram.cd-active {
  border-color: var(--accent-amber);
  background: rgba(255, 179, 0, 0.06);
  box-shadow: 0 0 14px rgba(255, 179, 0, 0.3);
}

/* Chord name */
.cd-chord-name {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: 0.5px;
}
.chord-diagram.cd-active .cd-chord-name {
  color: var(--accent-amber);
}

/* Voicing tabs */
.cd-voicing-tabs {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
  justify-content: center;
}
.cd-tab-btn {
  font-size: 0.58rem;
  padding: 2px 5px;
  border-radius: 3px;
  border: 1px solid var(--border-accent);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: background 0.1s ease, color 0.1s ease;
  line-height: 1.4;
}
.cd-tab-btn:hover {
  background: rgba(76, 175, 80, 0.15);
  color: var(--accent-green);
}
.cd-tab-btn.cd-tab-active {
  background: var(--accent-green);
  border-color: var(--accent-green);
  color: #000;
}

/* SVG wrapper */
.cd-svg-wrap {
  width: 98px;
}
.cd-svg {
  width: 100%;
  height: auto;
  display: block;
}

/* SVG element styles */
.cd-marker {
  font-size: 10px;
  fill: var(--text-muted);
  font-family: sans-serif;
}
.cd-nut {
  fill: var(--text-primary);
}
.cd-string {
  stroke: var(--border-accent);
  stroke-width: 1;
}
.cd-fret {
  stroke: var(--border);
  stroke-width: 1;
}
.cd-dot {
  fill: var(--accent-green);
}
.chord-diagram.cd-active .cd-dot {
  fill: var(--accent-amber);
}
.cd-fret-label {
  font-size: 9px;
  fill: var(--text-muted);
  font-family: sans-serif;
  text-anchor: start;
}

/* Tab notation */
.cd-tab {
  font-family: monospace;
  font-size: 0.6rem;
  color: var(--text-muted);
  line-height: 1.5;
  text-align: left;
  letter-spacing: 0.5px;
  white-space: pre;
}
.cd-tab-line {
  line-height: 1.45;
}

/* No-data fallback */
.cd-no-data {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-style: italic;
  padding: 20px 0;
}
</style>
