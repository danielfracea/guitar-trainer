<script setup>
import { ref, onMounted } from 'vue'
import { getTemplates, createSession } from '../services/api.js'

const emit = defineEmits(['session-logged', 'view-exercise'])

const templates = ref([])
const loading = ref(true)
const error = ref(null)
const loggingId = ref(null)

async function fetchTemplates() {
  loading.value = true
  error.value = null
  try {
    const res = await getTemplates()
    templates.value = res.data
  } catch {
    error.value = 'Failed to load templates. Is the backend running?'
  } finally {
    loading.value = false
  }
}

async function logSession(template) {
  loggingId.value = template.id
  try {
    await createSession({
      date: new Date().toISOString(),
      templateId: template.id,
      templateName: template.name,
      exercises: template.exercises,
      totalDuration: template.totalDuration,
      notes: '',
      completed: true
    })
    emit('session-logged', template.name)
  } catch {
    // silently ignore, toast will not show
  } finally {
    loggingId.value = null
  }
}

onMounted(fetchTemplates)
</script>

<template>
  <div class="templates-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">Practice Templates</h2>
        <p class="page-subtitle">Choose a structured routine, log it to your journal when done</p>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      Loading templates…
    </div>
    <div v-else-if="error" class="error-message">{{ error }}</div>

    <div v-else class="templates-grid">
      <div
        v-for="template in templates"
        :key="template.id"
        class="template-card"
      >
        <div class="card-top">
          <span class="template-icon">{{ template.icon }}</span>
          <span class="level-badge" :class="'level-' + template.level.toLowerCase()">
            {{ template.level }}
          </span>
        </div>

        <h3 class="template-name">{{ template.name }}</h3>
        <p class="template-desc">{{ template.description }}</p>

        <div class="duration-row">
          <span class="duration-pill">⏱ {{ template.totalDuration }} min</span>
          <span class="exercise-count">{{ template.exercises.length }} exercises</span>
        </div>

        <ul class="exercise-list">
          <li
            v-for="ex in template.exercises"
            :key="ex.exerciseId"
            class="exercise-item"
          >
            <span class="ex-name">{{ ex.exerciseName }}</span>
            <span class="ex-duration">{{ ex.duration }} min</span>
          </li>
        </ul>

        <div class="tip-box" v-if="template.tip">
          💡 <em>{{ template.tip }}</em>
        </div>

        <button
          class="btn btn-primary log-btn"
          :disabled="loggingId === template.id"
          @click="logSession(template)"
        >
          <span v-if="loggingId === template.id">Logging…</span>
          <span v-else>✓ Log This Session</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.templates-page {
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

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.template-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.template-card:hover {
  border-color: var(--accent-green);
  box-shadow: 0 4px 24px rgba(76,175,80,0.12);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.template-icon {
  font-size: 2rem;
  line-height: 1;
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

.level-advanced {
  background: rgba(244, 67, 54, 0.15);
  color: #f44336;
}

.template-name {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.template-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0;
}

.duration-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.duration-pill {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--accent-amber);
  background: rgba(255,179,0,0.1);
  padding: 4px 10px;
  border-radius: 20px;
}

.exercise-count {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.exercise-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.exercise-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  padding: 6px 10px;
  background: rgba(255,255,255,0.03);
  border-radius: 8px;
  border-left: 3px solid var(--accent-green);
}

.ex-name {
  color: var(--text-primary);
}

.ex-duration {
  color: var(--text-muted);
  font-size: 0.78rem;
}

.tip-box {
  font-size: 0.8rem;
  color: var(--text-muted);
  background: rgba(255,179,0,0.05);
  border: 1px solid rgba(255,179,0,0.15);
  border-radius: 8px;
  padding: 8px 12px;
  line-height: 1.4;
}

.log-btn {
  margin-top: auto;
  width: 100%;
}
</style>
