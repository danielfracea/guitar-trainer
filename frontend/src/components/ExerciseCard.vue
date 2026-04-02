<script setup>
defineProps({
  exercise: { type: Object, required: true }
})
defineEmits(['customize', 'view'])

const typeLabels = {
  scale: 'Scale',
  chords: 'Chords',
  fingerpicking: 'Fingerpicking',
  barre: 'Barre'
}

function settingsSummary(exercise) {
  const s = exercise.settings
  if (exercise.type === 'scale') return `${s.rootNote} ${s.scaleType.replace(/_/g, ' ')} · ${s.tempo} BPM`
  if (exercise.type === 'chords') return `${s.chords.join(' › ')} · ${s.tempo} BPM · ${s.beatsPerChord} beats`
  if (exercise.type === 'fingerpicking') return `Pattern: ${s.pattern} · ${s.tempo} BPM`
  if (exercise.type === 'barre') return `Chord: ${s.chord} · ${s.tempo} BPM · ×${s.repetitions}`
  return ''
}
</script>

<template>
  <div class="exercise-card">
    <div class="card-header">
      <span :class="['badge', `badge-${exercise.type}`]">{{ typeLabels[exercise.type] || exercise.type }}</span>
      <span class="card-id">#{{ exercise.id }}</span>
    </div>
    <h3 class="card-title">{{ exercise.name }}</h3>
    <p class="card-desc">{{ exercise.description }}</p>
    <div class="card-settings">
      <span class="settings-icon">⚙</span>
      <span class="settings-text">{{ settingsSummary(exercise) }}</span>
    </div>
    <div class="card-footer">
      <button class="btn btn-primary" @click="$emit('view', exercise)">
        ▶ Practice
      </button>
      <button class="btn btn-amber" @click="$emit('customize', exercise)">
        ✎ Customize
      </button>
    </div>
  </div>
</template>

<style scoped>
.exercise-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
}

.exercise-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--accent-green), var(--accent-amber));
  opacity: 0;
  transition: opacity 0.2s;
}

.exercise-card:hover {
  border-color: var(--border-accent);
  background: var(--bg-card-hover);
  transform: translateY(-3px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}

.exercise-card:hover::before {
  opacity: 1;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-id {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
}

.card-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
}

.card-desc {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.6;
  flex: 1;
}

.card-settings {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.settings-icon {
  font-size: 0.85rem;
  color: var(--accent-amber);
}

.card-footer {
  padding-top: 4px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
