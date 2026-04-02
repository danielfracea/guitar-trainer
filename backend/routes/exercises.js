const express = require('express');
const router = express.Router();
const { exercises, defaultExercises } = require('../data/exercises');

// GET /api/exercises
router.get('/', (req, res) => {
  res.json(exercises);
});

// GET /api/exercises/:id
router.get('/:id', (req, res) => {
  const exercise = exercises.find(e => e.id === parseInt(req.params.id));
  if (!exercise) return res.status(404).json({ error: 'Exercise not found' });
  res.json(exercise);
});

// PUT /api/exercises/:id
router.put('/:id', (req, res) => {
  const index = exercises.findIndex(e => e.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Exercise not found' });
  exercises[index] = { ...exercises[index], ...req.body, id: exercises[index].id };
  res.json(exercises[index]);
});

// POST /api/exercises/reset
router.post('/reset', (req, res) => {
  exercises.splice(0, exercises.length, ...JSON.parse(JSON.stringify(defaultExercises)));
  res.json({ message: 'Exercises reset to defaults', exercises });
});

module.exports = router;
