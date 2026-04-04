<script setup>
import { ref, computed, onMounted } from 'vue'
import ExerciseList from './components/ExerciseList.vue'
import ExerciseCustomizer from './components/ExerciseCustomizer.vue'
import ExerciseView from './components/ExerciseView.vue'
import PracticeTemplates from './components/PracticeTemplates.vue'
import PracticeJournal from './components/PracticeJournal.vue'
import Lessons from './components/Lessons.vue'
import GuitarTablature from './components/GuitarTablature.vue'
import { getExercises } from './services/api.js'

const exercises = ref([])
const loading = ref(true)
const error = ref(null)
// top-level tabs: 'exercises' | 'templates' | 'journal'
const activeTab = ref('exercises')
// sub-view within exercises tab: 'list' | 'customize' | 'view'
const currentView = ref('list')
const selectedExercise = ref(null)
const toast = ref(null)
let toastTimer = null

const isSubView = computed(() => currentView.value !== 'list')

async function fetchExercises() {
  loading.value = true
  error.value = null
  try {
    const res = await getExercises()
    exercises.value = res.data
  } catch (e) {
    error.value = 'Failed to load exercises. Is the backend running?'
  } finally {
    loading.value = false
  }
}

function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = null }, 3000)
}

function onCustomize(exercise) {
  selectedExercise.value = exercise
  currentView.value = 'customize'
}

function onView(exercise) {
  selectedExercise.value = exercise
  currentView.value = 'view'
}

async function onSaved() {
  showToast('✓ Exercise saved!')
  currentView.value = 'list'
  await fetchExercises()
}

async function onReset() {
  showToast('↺ All exercises reset to defaults')
  currentView.value = 'list'
  await fetchExercises()
}

function onBack() {
  currentView.value = 'list'
}

function onSessionLogged(templateName) {
  showToast(`✓ Session logged: ${templateName}`)
}

function switchTab(tab) {
  if (isSubView.value && tab !== 'exercises') {
    currentView.value = 'list'
  }
  activeTab.value = tab
}

onMounted(fetchExercises)
</script>

<template>
  <div id="app-wrapper">
    <header class="app-header">
      <div class="header-inner">
        <div class="header-logo">
          <span class="logo-icon">🎸</span>
          <div>
            <h1 class="logo-title">Guitar Trainer</h1>
            <p class="logo-sub">Build your skills, one exercise at a time</p>
          </div>
        </div>
        <nav class="header-nav">
          <template v-if="isSubView && activeTab === 'exercises'">
            <button class="btn btn-secondary" @click="onBack">
              ← Back to Exercises
            </button>
          </template>
          <template v-else>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'exercises' }"
              @click="switchTab('exercises')"
            >🎸 Exercises</button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'templates' }"
              @click="switchTab('templates')"
            >📋 Templates</button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'journal' }"
              @click="switchTab('journal')"
            >📓 Journal</button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'lessons' }"
              @click="switchTab('lessons')"
            >📖 Lessons</button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'tablature' }"
              @click="switchTab('tablature')"
            >🎵 Tablature</button>
          </template>
        </nav>
      </div>
    </header>

    <main class="app-main">
      <!-- Exercises Tab -->
      <template v-if="activeTab === 'exercises'">
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          Loading exercises…
        </div>
        <div v-else-if="error" class="error-message">{{ error }}</div>
        <template v-else>
          <ExerciseList
            v-if="currentView === 'list'"
            :exercises="exercises"
            @customize="onCustomize"
            @view="onView"
          />
          <ExerciseView
            v-else-if="currentView === 'view'"
            :exercise="selectedExercise"
            @back="onBack"
            @customize="onCustomize"
          />
          <ExerciseCustomizer
            v-else-if="currentView === 'customize'"
            :exercise="selectedExercise"
            @saved="onSaved"
            @reset="onReset"
            @back="onBack"
          />
        </template>
      </template>

      <!-- Templates Tab -->
      <PracticeTemplates
        v-else-if="activeTab === 'templates'"
        @session-logged="onSessionLogged"
      />

      <!-- Journal Tab -->
      <PracticeJournal
        v-else-if="activeTab === 'journal'"
      />

      <!-- Lessons Tab -->
      <Lessons
        v-else-if="activeTab === 'lessons'"
      />

      <!-- Tablature Tab -->
      <GuitarTablature
        v-else-if="activeTab === 'tablature'"
      />
    </main>

    <Transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </Transition>
  </div>
</template>

<style>
@import './assets/main.css';

.app-header {
  background: linear-gradient(135deg, #111 0%, #1a1a1a 100%);
  border-bottom: 1px solid #2a2a2a;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 16px rgba(0,0,0,0.5);
}

.header-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
}

.header-logo {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo-icon {
  font-size: 2rem;
  filter: drop-shadow(0 0 8px rgba(76,175,80,0.5));
}

.logo-title {
  font-size: 1.4rem;
  font-weight: 800;
  background: linear-gradient(90deg, #4caf50, #ffb300);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

.logo-sub {
  font-size: 0.75rem;
  color: #666;
  margin-top: 1px;
}

.app-main {
  max-width: 1100px;
  margin: 0 auto;
  padding: 36px 24px;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-btn {
  background: none;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 7px 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: var(--text-primary);
  border-color: #333;
}

.tab-btn.active {
  color: #4caf50;
  border-color: rgba(76,175,80,0.4);
  background: rgba(76,175,80,0.08);
}

.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(20px); }
</style>
