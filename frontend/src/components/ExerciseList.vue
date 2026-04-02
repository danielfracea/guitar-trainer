<script setup>
import ExerciseCard from './ExerciseCard.vue'

defineProps({
  exercises: { type: Array, required: true }
})
defineEmits(['customize'])
</script>

<template>
  <div class="exercise-list">
    <div class="list-header">
      <div>
        <h2 class="list-title">Your Practice Exercises</h2>
        <p class="list-subtitle">{{ exercises.length }} exercises · Click "Customize" to adjust settings</p>
      </div>
    </div>
    <div v-if="exercises.length === 0" class="empty-state">
      <p>No exercises found.</p>
    </div>
    <div class="exercise-grid" v-else>
      <ExerciseCard
        v-for="exercise in exercises"
        :key="exercise.id"
        :exercise="exercise"
        @customize="$emit('customize', exercise)"
      />
    </div>
  </div>
</template>

<style scoped>
.exercise-list {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.list-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.list-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-primary);
}

.list-subtitle {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.exercise-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: var(--text-muted);
}
</style>
