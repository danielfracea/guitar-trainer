const express = require('express');
const router = express.Router();
const { defaultTemplates } = require('../data/templates');

router.get('/', (req, res) => {
  res.json(defaultTemplates);
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const template = defaultTemplates.find(t => t.id === id);
  if (!template) return res.status(404).json({ error: 'Template not found' });
  res.json(template);
});

module.exports = router;
