const express = require('express');
const router = express.Router();
const { getSessions, getSession, addSession, updateSession, deleteSession } = require('../data/sessions');

const VALID_MOODS = ['great', 'good', 'okay', 'tough']

router.get('/', (req, res) => {
  res.json(getSessions());
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const session = getSession(id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

router.post('/', (req, res) => {
  const { date, templateId, templateName, exercises, totalDuration, notes, mood, completed } = req.body;

  if (date !== undefined && isNaN(Date.parse(date))) {
    return res.status(400).json({ error: 'Invalid date' });
  }
  if (totalDuration !== undefined && (typeof totalDuration !== 'number' || totalDuration < 0)) {
    return res.status(400).json({ error: 'totalDuration must be a non-negative number' });
  }
  if (mood !== undefined && mood !== null && !VALID_MOODS.includes(mood)) {
    return res.status(400).json({ error: `mood must be one of: ${VALID_MOODS.join(', ')}` });
  }

  const session = addSession({ date, templateId, templateName, exercises, totalDuration, notes, mood, completed });
  res.status(201).json(session);
});

router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { notes, mood, totalDuration, completed } = req.body;

  if (totalDuration !== undefined && (typeof totalDuration !== 'number' || totalDuration < 0)) {
    return res.status(400).json({ error: 'totalDuration must be a non-negative number' });
  }
  if (mood !== undefined && mood !== null && !VALID_MOODS.includes(mood)) {
    return res.status(400).json({ error: `mood must be one of: ${VALID_MOODS.join(', ')}` });
  }

  const session = updateSession(id, { notes, mood, totalDuration, completed });
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const ok = deleteSession(id);
  if (!ok) return res.status(404).json({ error: 'Session not found' });
  res.json({ success: true });
});

module.exports = router;
