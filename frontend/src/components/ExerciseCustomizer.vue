<script setup>
import { ref, reactive, computed } from 'vue'
import { updateExercise, resetExercises } from '../services/api.js'

const props = defineProps({
  exercise: { type: Object, required: true }
})

const emit = defineEmits(['saved', 'reset', 'back'])

// Deep clone settings for editing
const form = reactive(JSON.parse(JSON.stringify(props.exercise)))

const saving = ref(false)
const resetting = ref(false)
const saveError = ref(null)

const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const scaleTypes = [
  { value: 'major', label: 'Major' },
  { value: 'minor', label: 'Minor' },
  { value: 'pentatonic_minor', label: 'Pentatonic Minor' },
  { value: 'pentatonic_major', label: 'Pentatonic Major' },
  { value: 'blues', label: 'Blues' },
  { value: 'dorian', label: 'Dorian' },
  { value: 'phrygian', label: 'Phrygian' },
  { value: 'lydian', label: 'Lydian' },
  { value: 'mixolydian', label: 'Mixolydian' },
  { value: 'locrian', label: 'Locrian' },
  { value: 'harmonic_minor', label: 'Harmonic Minor' },
  { value: 'melodic_minor', label: 'Melodic Minor' },
  { value: 'whole_tone', label: 'Whole Tone' },
  { value: 'diminished', label: 'Diminished' },
  { value: 'hungarian_minor', label: 'Hungarian Minor' }
]

// Chord management
const newChord = ref('')

function addChord() {
  const chord = newChord.value.trim()
  if (chord && !form.settings.chords.includes(chord)) {
    form.settings.chords.push(chord)
  }
  newChord.value = ''
}

function removeChord(index) {
  form.settings.chords.splice(index, 1)
}

function onNewChordKeydown(e) {
  if (e.key === 'Enter') { e.preventDefault(); addChord() }
}

async function save() {
  saving.value = true
  saveError.value = null
  try {
    await updateExercise(props.exercise.id, form)
    emit('saved')
  } catch (e) {
    saveError.value = 'Failed to save. Please try again.'
  } finally {
    saving.value = false
  }
}

async function reset() {
  if (!confirm('Reset ALL exercises to defaults? This cannot be undone.')) return
  resetting.value = true
  try {
    await resetExercises()
    emit('reset')
  } catch (e) {
    saveError.value = 'Failed to reset exercises.'
  } finally {
    resetting.value = false
  }
}

const typeBadgeClass = computed(() => `badge badge-${props.exercise.type}`)
const typeLabels = { scale: 'Scale', chords: 'Chords', fingerpicking: 'Fingerpicking', barre: 'Barre' }
</script>

<template>
  <div class="customizer">
    <div class="customizer-header">
      <div class="customizer-meta">
        <span :class="typeBadgeClass">{{ typeLabels[exercise.type] || exercise.type }}</span>
        <h2 class="customizer-title">{{ exercise.name }}</h2>
        <p class="customizer-desc">{{ exercise.description }}</p>
      </div>
    </div>

    <div class="customizer-body">
      <form @submit.prevent="save" class="settings-form">

        <!-- SCALE settings -->
        <template v-if="exercise.type === 'scale'">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Root Note</label>
              <select class="form-select" v-model="form.settings.rootNote">
                <option v-for="note in notes" :key="note" :value="note">{{ note }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Scale Type</label>
              <select class="form-select" v-model="form.settings.scaleType">
                <option v-for="st in scaleTypes" :key="st.value" :value="st.value">{{ st.label }}</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">
              Tempo
              <span class="range-value">{{ form.settings.tempo }} BPM</span>
            </label>
            <input type="range" class="form-range" v-model.number="form.settings.tempo" min="40" max="200" step="1" />
            <div class="range-labels"><span>40</span><span>200 BPM</span></div>
          </div>
        </template>

        <!-- CHORDS settings -->
        <template v-else-if="exercise.type === 'chords'">
          <div class="form-group">
            <label class="form-label">Chord Sequence</label>
            <div class="chord-tags">
              <span v-for="(chord, i) in form.settings.chords" :key="i" class="chord-tag">
                {{ chord }}
                <button type="button" class="chord-tag-remove" @click="removeChord(i)" title="Remove">×</button>
              </span>
            </div>
            <div class="chord-add-row">
              <input
                type="text"
                class="form-input"
                v-model="newChord"
                placeholder="e.g. Am7"
                @keydown="onNewChordKeydown"
                maxlength="6"
              />
              <button type="button" class="btn btn-secondary" @click="addChord">+ Add</button>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">
                Tempo
                <span class="range-value">{{ form.settings.tempo }} BPM</span>
              </label>
              <input type="range" class="form-range" v-model.number="form.settings.tempo" min="40" max="200" step="1" />
              <div class="range-labels"><span>40</span><span>200</span></div>
            </div>
            <div class="form-group">
              <label class="form-label">
                Beats per Chord
                <span class="range-value">{{ form.settings.beatsPerChord }}</span>
              </label>
              <input type="range" class="form-range" v-model.number="form.settings.beatsPerChord" min="1" max="8" step="1" />
              <div class="range-labels"><span>1</span><span>8</span></div>
            </div>
          </div>
        </template>

        <!-- FINGERPICKING settings -->
        <template v-else-if="exercise.type === 'fingerpicking'">
          <div class="form-group">
            <label class="form-label">Pattern</label>
            <input type="text" class="form-input" v-model="form.settings.pattern" placeholder="e.g. p-i-m-a" />
            <span class="form-hint">Use p (thumb), i (index), m (middle), a (ring) separated by hyphens</span>
          </div>
          <div class="form-group">
            <label class="form-label">
              Tempo
              <span class="range-value">{{ form.settings.tempo }} BPM</span>
            </label>
            <input type="range" class="form-range" v-model.number="form.settings.tempo" min="40" max="200" step="1" />
            <div class="range-labels"><span>40</span><span>200 BPM</span></div>
          </div>
        </template>

        <!-- BARRE settings -->
        <template v-else-if="exercise.type === 'barre'">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Chord</label>
              <input type="text" class="form-input" v-model="form.settings.chord" placeholder="e.g. Bm" maxlength="6" />
            </div>
            <div class="form-group">
              <label class="form-label">
                Repetitions
                <span class="range-value">{{ form.settings.repetitions }}</span>
              </label>
              <input type="range" class="form-range" v-model.number="form.settings.repetitions" min="1" max="8" step="1" />
              <div class="range-labels"><span>1</span><span>8</span></div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">
              Tempo
              <span class="range-value">{{ form.settings.tempo }} BPM</span>
            </label>
            <input type="range" class="form-range" v-model.number="form.settings.tempo" min="40" max="200" step="1" />
            <div class="range-labels"><span>40</span><span>200 BPM</span></div>
          </div>
        </template>

        <div v-if="saveError" class="error-message" style="margin-top: 8px">{{ saveError }}</div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="saving">
            <span v-if="saving">Saving…</span>
            <span v-else>✓ Save Changes</span>
          </button>
          <button type="button" class="btn btn-danger" @click="reset" :disabled="resetting">
            <span v-if="resetting">Resetting…</span>
            <span v-else>↺ Reset All to Defaults</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.customizer {
  display: flex;
  flex-direction: column;
  gap: 0;
  max-width: 680px;
}

.customizer-header {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-bottom: none;
  border-radius: var(--radius) var(--radius) 0 0;
  padding: 28px 32px 24px;
  position: relative;
  overflow: hidden;
}

.customizer-header::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--accent-green), var(--accent-amber));
}

.customizer-meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.customizer-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
}

.customizer-desc {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.customizer-body {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-top: 1px solid var(--border-accent);
  border-radius: 0 0 var(--radius) var(--radius);
  padding: 28px 32px;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.form-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-style: italic;
}

.form-actions {
  display: flex;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
}
</style>
