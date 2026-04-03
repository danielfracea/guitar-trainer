<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getSessions, createSession, updateSession, deleteSession } from '../services/api.js'

const sessions = ref([])
const loading = ref(true)
const error = ref(null)
const expandedId = ref(null)
const editingId = ref(null)
const deletingId = ref(null)
const savingId = ref(null)

const showNewEntryForm = ref(false)
const submitting = ref(false)

const newEntry = reactive({
  date: todayISO(),
  templateName: '',
  totalDuration: 30,
  notes: '',
  mood: ''
})

const editNotes = reactive({})

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
}

function formatTime(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

const moodOptions = [
  { value: 'great', label: '😄 Great' },
  { value: 'good', label: '🙂 Good' },
  { value: 'okay', label: '😐 Okay' },
  { value: 'tough', label: '😤 Tough' }
]

function moodLabel(mood) {
  const opt = moodOptions.find(m => m.value === mood)
  return opt ? opt.label : ''
}

async function fetchSessions() {
  loading.value = true
  error.value = null
  try {
    const res = await getSessions()
    sessions.value = res.data
  } catch {
    error.value = 'Failed to load journal. Is the backend running?'
  } finally {
    loading.value = false
  }
}

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
  if (expandedId.value !== id) editingId.value = null
}

function startEditing(session) {
  editingId.value = session.id
  editNotes[session.id] = session.notes || ''
}

function cancelEditing() {
  editingId.value = null
}

async function saveNotes(session) {
  savingId.value = session.id
  try {
    await updateSession(session.id, { notes: editNotes[session.id] })
    session.notes = editNotes[session.id]
    editingId.value = null
  } catch {
    // noop
  } finally {
    savingId.value = null
  }
}

async function removeSession(id) {
  deletingId.value = id
  try {
    await deleteSession(id)
    sessions.value = sessions.value.filter(s => s.id !== id)
    if (expandedId.value === id) expandedId.value = null
  } catch {
    // noop
  } finally {
    deletingId.value = null
  }
}

async function submitNewEntry() {
  submitting.value = true
  try {
    const payload = {
      date: new Date(newEntry.date).toISOString(),
      templateName: newEntry.templateName.trim() || null,
      exercises: [],
      totalDuration: Number(newEntry.totalDuration) || 0,
      notes: newEntry.notes.trim(),
      mood: newEntry.mood || null,
      completed: true
    }
    const res = await createSession(payload)
    sessions.value.unshift(res.data)
    showNewEntryForm.value = false
    Object.assign(newEntry, { date: todayISO(), templateName: '', totalDuration: 30, notes: '', mood: '' })
  } catch {
    // noop
  } finally {
    submitting.value = false
  }
}

const totalMinutes = computed(() => sessions.value.reduce((sum, s) => sum + (s.totalDuration || 0), 0))
const totalSessions = computed(() => sessions.value.length)

onMounted(fetchSessions)
</script>

<template>
  <div class="journal-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">Practice Journal</h2>
        <p class="page-subtitle">
          {{ totalSessions }} session{{ totalSessions !== 1 ? 's' : '' }} · {{ totalMinutes }} min total
        </p>
      </div>
      <button class="btn btn-primary" @click="showNewEntryForm = !showNewEntryForm">
        {{ showNewEntryForm ? '✕ Cancel' : '+ New Entry' }}
      </button>
    </div>

    <!-- New Entry Form -->
    <Transition name="slide">
      <div v-if="showNewEntryForm" class="new-entry-form">
        <h3 class="form-title">Log a Practice Session</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>Date</label>
            <input type="date" v-model="newEntry.date" class="form-input" />
          </div>
          <div class="form-group">
            <label>Duration (minutes)</label>
            <input type="number" v-model="newEntry.totalDuration" min="1" max="300" class="form-input" />
          </div>
          <div class="form-group">
            <label>Template / Focus (optional)</label>
            <input type="text" v-model="newEntry.templateName" placeholder="e.g. Chord Mastery or Free Practice" class="form-input" />
          </div>
          <div class="form-group">
            <label>Mood</label>
            <select v-model="newEntry.mood" class="form-input">
              <option value="">— Select —</option>
              <option v-for="m in moodOptions" :key="m.value" :value="m.value">{{ m.label }}</option>
            </select>
          </div>
        </div>
        <div class="form-group full-width">
          <label>Notes</label>
          <textarea v-model="newEntry.notes" placeholder="What did you work on? What went well? What needs improvement?" class="form-textarea" rows="3"></textarea>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" :disabled="submitting" @click="submitNewEntry">
            {{ submitting ? 'Saving…' : '✓ Save Entry' }}
          </button>
        </div>
      </div>
    </Transition>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      Loading journal…
    </div>
    <div v-else-if="error" class="error-message">{{ error }}</div>

    <div v-else-if="sessions.length === 0" class="empty-state">
      <p class="empty-icon">📓</p>
      <p>No sessions logged yet.</p>
      <p class="empty-hint">Use the <strong>+ New Entry</strong> button above or log a session from the Templates page.</p>
    </div>

    <div v-else class="sessions-list">
      <div
        v-for="session in sessions"
        :key="session.id"
        class="session-card"
        :class="{ expanded: expandedId === session.id }"
      >
        <!-- Session Header Row -->
        <div class="session-header" @click="toggleExpand(session.id)">
          <div class="session-meta">
            <span class="session-date">{{ formatDate(session.date) }}</span>
            <span class="session-time">{{ formatTime(session.date) }}</span>
          </div>
          <div class="session-badges">
            <span v-if="session.templateName" class="template-tag">{{ session.templateName }}</span>
            <span v-else class="template-tag free">Free Practice</span>
            <span class="duration-tag">⏱ {{ session.totalDuration }} min</span>
            <span v-if="session.mood" class="mood-tag">{{ moodLabel(session.mood) }}</span>
          </div>
          <div class="session-expand-icon">{{ expandedId === session.id ? '▲' : '▼' }}</div>
        </div>

        <!-- Notes preview when collapsed -->
        <p v-if="expandedId !== session.id && session.notes" class="notes-preview">
          {{ session.notes }}
        </p>

        <!-- Expanded Detail -->
        <Transition name="expand">
          <div v-if="expandedId === session.id" class="session-detail">
            <!-- Exercises list -->
            <div v-if="session.exercises && session.exercises.length" class="detail-section">
              <h4 class="detail-heading">Exercises</h4>
              <ul class="ex-list">
                <li v-for="ex in session.exercises" :key="ex.exerciseId" class="ex-item">
                  <span>{{ ex.exerciseName }}</span>
                  <span class="ex-dur">{{ ex.duration }} min</span>
                </li>
              </ul>
            </div>

            <!-- Notes editing -->
            <div class="detail-section">
              <div class="notes-header">
                <h4 class="detail-heading">Notes</h4>
                <button v-if="editingId !== session.id" class="btn-link" @click="startEditing(session)">Edit</button>
              </div>

              <div v-if="editingId === session.id">
                <textarea
                  v-model="editNotes[session.id]"
                  class="form-textarea"
                  rows="4"
                  placeholder="Add your practice notes here…"
                ></textarea>
                <div class="notes-actions">
                  <button class="btn btn-primary btn-sm" :disabled="savingId === session.id" @click="saveNotes(session)">
                    {{ savingId === session.id ? 'Saving…' : 'Save Notes' }}
                  </button>
                  <button class="btn btn-secondary btn-sm" @click="cancelEditing">Cancel</button>
                </div>
              </div>
              <p v-else-if="session.notes" class="notes-content">{{ session.notes }}</p>
              <p v-else class="notes-empty">No notes yet. Click Edit to add some.</p>
            </div>

            <!-- Delete -->
            <div class="delete-row">
              <button
                class="btn-danger"
                :disabled="deletingId === session.id"
                @click="removeSession(session.id)"
              >
                {{ deletingId === session.id ? 'Deleting…' : '🗑 Delete Entry' }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.journal-page {
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

/* New Entry Form */
.new-entry-form {
  background: var(--surface);
  border: 1px solid var(--accent-green);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  color: var(--text-primary);
  padding: 8px 12px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: var(--accent-green);
}

.form-textarea {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  color: var(--text-primary);
  padding: 10px 12px;
  font-size: 0.9rem;
  outline: none;
  resize: vertical;
  transition: border-color 0.2s;
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;
}

.form-textarea:focus {
  border-color: var(--accent-green);
}

.form-actions {
  display: flex;
  gap: 10px;
}

/* Sessions List */
.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.session-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.session-card.expanded {
  border-color: var(--accent-green);
}

.session-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  cursor: pointer;
  user-select: none;
}

.session-header:hover {
  background: rgba(255,255,255,0.02);
}

.session-meta {
  display: flex;
  flex-direction: column;
  min-width: 160px;
}

.session-date {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.session-time {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.session-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
}

.template-tag {
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(76,175,80,0.12);
  color: #4caf50;
  padding: 3px 10px;
  border-radius: 20px;
}

.template-tag.free {
  background: rgba(150,150,150,0.1);
  color: #888;
}

.duration-tag {
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(255,179,0,0.1);
  color: #ffb300;
  padding: 3px 10px;
  border-radius: 20px;
}

.mood-tag {
  font-size: 0.75rem;
  background: rgba(255,255,255,0.06);
  color: var(--text-muted);
  padding: 3px 10px;
  border-radius: 20px;
}

.session-expand-icon {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.notes-preview {
  padding: 0 20px 14px;
  font-size: 0.83rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

/* Session Detail */
.session-detail {
  padding: 0 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  border-top: 1px solid var(--border);
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 16px;
}

.detail-heading {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  margin: 0;
}

.ex-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ex-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--text-primary);
  background: rgba(255,255,255,0.03);
  padding: 6px 10px;
  border-radius: 8px;
}

.ex-dur {
  color: var(--text-muted);
}

.notes-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.notes-content {
  font-size: 0.88rem;
  color: var(--text-primary);
  line-height: 1.6;
  white-space: pre-wrap;
  margin: 0;
}

.notes-empty {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-style: italic;
  margin: 0;
}

.notes-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.btn-link {
  background: none;
  border: none;
  color: var(--accent-green);
  font-size: 0.82rem;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

.btn-link:hover {
  opacity: 0.8;
}

.btn-sm {
  padding: 6px 14px !important;
  font-size: 0.82rem !important;
}

.delete-row {
  display: flex;
  justify-content: flex-end;
}

.btn-danger {
  background: none;
  border: 1px solid rgba(244,67,54,0.3);
  color: #f44336;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-danger:hover {
  background: rgba(244,67,54,0.08);
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: default;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-icon {
  font-size: 3rem;
}

.empty-hint {
  font-size: 0.85rem;
}

/* Transitions */
.slide-enter-active, .slide-leave-active { transition: all 0.25s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-8px); }

.expand-enter-active, .expand-leave-active { transition: opacity 0.2s ease; }
.expand-enter-from, .expand-leave-to { opacity: 0; }
</style>
