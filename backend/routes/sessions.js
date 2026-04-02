const express = require('express');
const router = express.Router();
const { getSessions, getSession, addSession, updateSession, deleteSession } = require('../data/sessions');

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
  const session = addSession({ date, templateId, templateName, exercises, totalDuration, notes, mood, completed });
  res.status(201).json(session);
});

router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { notes, mood, totalDuration, completed } = req.body;
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
