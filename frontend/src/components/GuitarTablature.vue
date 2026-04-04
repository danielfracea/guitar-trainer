<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  getTablatures,
  createTablature,
  updateTablature,
  deleteTablature,
} from '../services/api.js'
import {
  STRING_NAMES,
  emptyNote,
  emptyBar,
  sanitizeFretValue,
  resizeBars,
  generateAsciiTab,
} from '../utils/tablature.js'

const DENOMINATORS = [2, 4, 8, 16]
const NUMERATORS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

// ── State ────────────────────────────────────────────────────────────────────
const savedTabs = ref([])
const loading = ref(false)
const error = ref(null)
const toast = ref(null)
let toastTimer = null

// Current editor state
const tabName = ref('New Tab')
const numerator = ref(4)
const denominator = ref(4)
const bars = ref([])
const editingId = ref(null) // null = new tab, number = editing existing

// ── Helpers ──────────────────────────────────────────────────────────────────
function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = null }, 3000)
}

function currentEmptyBar() {
  return emptyBar(numerator.value)
}

// ── Bar management ────────────────────────────────────────────────────────────
function addBar() {
  bars.value.push(currentEmptyBar())
}

function removeLastBar() {
  if (bars.value.length > 1) bars.value.pop()
}

// ── Time-signature change: resize all bars to match new beat count ────────────
function onNumeratorChange() {
  bars.value = resizeBars(bars.value, numerator.value)
}

// ── Load saved tablatures ─────────────────────────────────────────────────────
async function fetchTabs() {
  loading.value = true
  error.value = null
  try {
    const res = await getTablatures()
    savedTabs.value = res.data
  } catch {
    error.value = 'Failed to load tablatures. Is the backend running?'
  } finally {
    loading.value = false
  }
}

// ── Editor reset (new blank tab) ──────────────────────────────────────────────
function newTab() {
  tabName.value = 'New Tab'
  numerator.value = 4
  denominator.value = 4
  bars.value = [emptyBar(4)]
  editingId.value = null
}

// ── Load a saved tab into the editor ─────────────────────────────────────────
function loadTab(tab) {
  tabName.value = tab.name
  numerator.value = tab.timeSignature.numerator
  denominator.value = tab.timeSignature.denominator
  bars.value = JSON.parse(JSON.stringify(tab.bars))
  editingId.value = tab.id
}

// ── Save (create or update) ───────────────────────────────────────────────────
async function saveTab() {
  const payload = {
    name: tabName.value.trim() || 'Untitled',
    timeSignature: { numerator: numerator.value, denominator: denominator.value },
    bars: bars.value,
  }
  try {
    if (editingId.value !== null) {
      await updateTablature(editingId.value, payload)
      showToast('✓ Tablature updated!')
    } else {
      const res = await createTablature(payload)
      editingId.value = res.data.id
      showToast('✓ Tablature saved!')
    }
    await fetchTabs()
  } catch {
    showToast('✗ Failed to save tablature')
  }
}

// ── Delete a saved tab ────────────────────────────────────────────────────────
async function deleteTab(tab) {
  try {
    await deleteTablature(tab.id)
    if (editingId.value === tab.id) newTab()
    await fetchTabs()
    showToast('✓ Tablature deleted')
  } catch {
    showToast('✗ Failed to delete tablature')
  }
}

// ── Download as ASCII text ────────────────────────────────────────────────────
const asciiTab = computed(() =>
  generateAsciiTab(
    tabName.value,
    { numerator: numerator.value, denominator: denominator.value },
    bars.value,
  )
)

function downloadTab() {
  const blob = new Blob([asciiTab.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safeName = (tabName.value || 'tab')
    .replace(/[/\\:*?"<>|]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 100) || 'tab'
  a.download = `${safeName}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Fret sanitization ─────────────────────────────────────────────────────────
function sanitizeFret(note, str) {
  note[str] = sanitizeFretValue(note[str])
}

// ── Init ──────────────────────────────────────────────────────────────────────
onMounted(() => {
  bars.value = [currentEmptyBar()]
  fetchTabs()
})
</script>

<template>
  <div class="tablature-page">

    <!-- Saved Tabs Sidebar -->
    <aside class="tab-sidebar">
      <div class="sidebar-header">
        <h3>Saved Tabs</h3>
        <button class="btn btn-secondary btn-sm" @click="newTab">+ New</button>
      </div>

      <div v-if="loading" class="loading-sm">Loading…</div>
      <div v-else-if="error" class="error-sm">{{ error }}</div>
      <ul v-else-if="savedTabs.length" class="saved-list">
        <li
          v-for="tab in savedTabs"
          :key="tab.id"
          class="saved-item"
          :class="{ active: editingId === tab.id }"
        >
          <button class="saved-name" @click="loadTab(tab)">
            {{ tab.name }}
            <span class="saved-ts">{{ tab.timeSignature.numerator }}/{{ tab.timeSignature.denominator }}</span>
          </button>
          <button class="btn-icon btn-danger-icon" title="Delete" @click="deleteTab(tab)">✕</button>
        </li>
      </ul>
      <p v-else class="empty-hint">No saved tabs yet.</p>
    </aside>

    <!-- Editor -->
    <section class="tab-editor">
      <!-- Toolbar -->
      <div class="editor-toolbar">
        <div class="toolbar-row">
          <input
            v-model="tabName"
            class="input tab-name-input"
            placeholder="Tab name"
            maxlength="80"
          />

          <div class="ts-group">
            <label class="ts-label">Time</label>
            <select v-model.number="numerator" class="select ts-select" @change="onNumeratorChange">
              <option v-for="n in NUMERATORS" :key="n" :value="n">{{ n }}</option>
            </select>
            <span class="ts-slash">/</span>
            <select v-model.number="denominator" class="select ts-select">
              <option v-for="d in DENOMINATORS" :key="d" :value="d">{{ d }}</option>
            </select>
          </div>

          <div class="toolbar-actions">
            <button class="btn btn-secondary btn-sm" @click="addBar">+ Bar</button>
            <button
              class="btn btn-secondary btn-sm"
              :disabled="bars.length <= 1"
              @click="removeLastBar"
            >− Bar</button>
            <button class="btn btn-primary btn-sm" @click="saveTab">💾 Save</button>
            <button class="btn btn-secondary btn-sm" @click="downloadTab">⬇ Download</button>
          </div>
        </div>
      </div>

      <!-- Tab Grid -->
      <div class="tab-scroll">
        <div class="tab-grid-wrapper">
          <table class="tab-grid">
            <thead>
              <tr>
                <th class="string-label"></th>
                <template v-for="(bar, bi) in bars" :key="bi">
                  <th
                    v-for="(_, ni) in bar.notes"
                    :key="ni"
                    class="beat-header"
                  >{{ ni === 0 ? bi + 1 : '' }}</th>
                  <th class="bar-sep-th"></th>
                </template>
              </tr>
            </thead>
            <tbody>
              <tr v-for="str in STRING_NAMES" :key="str">
                <td class="string-label">{{ str }}</td>
                <template v-for="(bar, bi) in bars" :key="bi">
                  <td v-for="(note, ni) in bar.notes" :key="ni" class="note-cell">
                    <input
                      v-model="note[str]"
                      class="fret-input"
                      maxlength="2"
                      :aria-label="`Bar ${bi + 1}, beat ${ni + 1}, string ${str}`"
                      @input="sanitizeFret(note, str)"
                    />
                  </td>
                  <td class="bar-sep">|</td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ASCII Preview -->
      <details class="ascii-preview">
        <summary>ASCII Preview</summary>
        <pre class="ascii-text">{{ asciiTab }}</pre>
      </details>
    </section>

    <Transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.tablature-page {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

/* ── Sidebar ── */
.tab-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: var(--card-bg, #1e1e1e);
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  padding: 16px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.sidebar-header h3 {
  font-size: 0.9rem;
  font-weight: 700;
  color: #ccc;
  margin: 0;
}

.saved-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.saved-item {
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 8px;
  padding: 4px 6px;
  transition: background 0.15s;
}

.saved-item:hover,
.saved-item.active {
  background: rgba(76, 175, 80, 0.1);
}

.saved-name {
  flex: 1;
  background: none;
  border: none;
  color: #ccc;
  font-size: 0.82rem;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px 0;
}

.saved-name:hover {
  color: #fff;
}

.saved-ts {
  font-size: 0.7rem;
  color: #666;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  padding: 2px 5px;
  border-radius: 4px;
}

.btn-danger-icon {
  color: #e53935;
}

.btn-danger-icon:hover {
  background: rgba(229, 57, 53, 0.15);
}

.empty-hint {
  font-size: 0.78rem;
  color: #555;
  text-align: center;
  margin-top: 12px;
}

.loading-sm,
.error-sm {
  font-size: 0.82rem;
  color: #888;
  text-align: center;
  padding: 8px 0;
}

/* ── Editor ── */
.tab-editor {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.editor-toolbar {
  background: var(--card-bg, #1e1e1e);
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  padding: 14px 16px;
}

.toolbar-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.tab-name-input {
  flex: 1;
  min-width: 160px;
}

.ts-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ts-label {
  font-size: 0.78rem;
  color: #888;
  font-weight: 600;
}

.ts-select {
  width: 60px;
}

.ts-slash {
  font-size: 1.1rem;
  color: #666;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* ── Tab Grid ── */
.tab-scroll {
  overflow-x: auto;
  background: var(--card-bg, #1e1e1e);
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  padding: 16px;
}

.tab-grid-wrapper {
  min-width: max-content;
}

.tab-grid {
  border-collapse: collapse;
  font-family: 'Courier New', monospace;
}

.string-label {
  width: 28px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #ffb300;
  text-align: right;
  padding-right: 6px;
  user-select: none;
}

.beat-header {
  font-size: 0.65rem;
  color: #555;
  padding: 2px 4px;
  text-align: center;
  min-width: 40px;
}

.bar-sep-th {
  width: 12px;
}

.note-cell {
  padding: 2px 3px;
}

.fret-input {
  width: 36px;
  height: 32px;
  text-align: center;
  background: #111;
  border: 1px solid #333;
  border-radius: 4px;
  color: #4caf50;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  font-weight: 700;
  outline: none;
  transition: border-color 0.15s;
}

.fret-input:focus {
  border-color: #4caf50;
  background: #151515;
}

.bar-sep {
  color: #555;
  font-weight: 700;
  font-size: 1rem;
  padding: 0 4px;
  user-select: none;
}

/* ── ASCII Preview ── */
.ascii-preview {
  background: var(--card-bg, #1e1e1e);
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  padding: 12px 16px;
}

.ascii-preview summary {
  cursor: pointer;
  font-size: 0.82rem;
  color: #888;
  font-weight: 600;
  user-select: none;
}

.ascii-text {
  margin-top: 12px;
  font-family: 'Courier New', monospace;
  font-size: 0.82rem;
  color: #aaa;
  white-space: pre;
  overflow-x: auto;
}

/* ── Buttons (local overrides where needed) ── */
.btn-sm {
  padding: 6px 12px;
  font-size: 0.8rem;
}

.btn-primary {
  background: linear-gradient(135deg, #388e3c, #4caf50);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  transition: opacity 0.2s;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-secondary {
  background: #2a2a2a;
  color: #ccc;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background: #333;
  color: #fff;
}

.btn-secondary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.input,
.select {
  background: #111;
  border: 1px solid #333;
  border-radius: 8px;
  color: #ccc;
  padding: 7px 10px;
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.15s;
}

.input:focus,
.select:focus {
  border-color: #4caf50;
}

/* ── Toast ── */
.toast {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  background: #222;
  color: #fff;
  padding: 10px 24px;
  border-radius: 24px;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1px solid #333;
  z-index: 9999;
  box-shadow: 0 4px 24px rgba(0,0,0,0.5);
}

.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(20px); }
</style>
