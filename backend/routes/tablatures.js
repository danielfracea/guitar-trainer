'use strict';

const express = require('express');
const router = express.Router();
const { tablatures, getNextId } = require('../data/tablatures');

const VALID_DENOMINATORS = [2, 4, 8, 16];

function validateTimeSignature(ts) {
  if (!ts || typeof ts !== 'object') return 'timeSignature must be an object';
  const { numerator, denominator } = ts;
  if (!Number.isInteger(numerator) || numerator < 1 || numerator > 12)
    return 'timeSignature.numerator must be an integer between 1 and 12';
  if (!VALID_DENOMINATORS.includes(denominator))
    return 'timeSignature.denominator must be one of 2, 4, 8, 16';
  return null;
}

function validateBars(bars, beatsPerBar) {
  if (!Array.isArray(bars)) return 'bars must be an array';
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    if (!bar || typeof bar !== 'object') return `bars[${i}] must be an object`;
    if (!Array.isArray(bar.notes)) return `bars[${i}].notes must be an array`;
    if (bar.notes.length !== beatsPerBar)
      return `bars[${i}].notes must have exactly ${beatsPerBar} entries (one per beat)`;
    for (let j = 0; j < bar.notes.length; j++) {
      const note = bar.notes[j];
      if (!note || typeof note !== 'object') return `bars[${i}].notes[${j}] must be an object`;
      const strings = ['e', 'B', 'G', 'D', 'A', 'E'];
      for (const s of strings) {
        const val = note[s];
        if (val !== '' && val !== null && val !== undefined) {
          const n = Number(val);
          if (!Number.isInteger(n) || n < 0 || n > 24)
            return `bars[${i}].notes[${j}].${s} must be a fret number (0-24) or empty`;
        }
      }
    }
  }
  return null;
}

// GET /api/tablatures
router.get('/', (req, res) => {
  res.json(tablatures);
});

// GET /api/tablatures/:id
router.get('/:id', (req, res) => {
  const tab = tablatures.find(t => t.id === parseInt(req.params.id));
  if (!tab) return res.status(404).json({ error: 'Tablature not found' });
  res.json(tab);
});

// POST /api/tablatures
router.post('/', (req, res) => {
  const { name, timeSignature, bars } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '')
    return res.status(400).json({ error: 'name is required and must be a non-empty string' });

  const tsError = validateTimeSignature(timeSignature);
  if (tsError) return res.status(400).json({ error: tsError });

  const barsToSave = bars || [];
  const barsError = validateBars(barsToSave, timeSignature.numerator);
  if (barsError) return res.status(400).json({ error: barsError });

  const tab = {
    id: getNextId(),
    name: name.trim(),
    timeSignature,
    bars: barsToSave,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tablatures.push(tab);
  res.status(201).json(tab);
});

// PUT /api/tablatures/:id
router.put('/:id', (req, res) => {
  const index = tablatures.findIndex(t => t.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Tablature not found' });

  const existing = tablatures[index];
  const { name, timeSignature, bars } = req.body;

  const updatedTs = timeSignature || existing.timeSignature;
  if (timeSignature) {
    const tsError = validateTimeSignature(timeSignature);
    if (tsError) return res.status(400).json({ error: tsError });
  }

  const updatedBars = bars !== undefined ? bars : existing.bars;
  const barsError = validateBars(updatedBars, updatedTs.numerator);
  if (barsError) return res.status(400).json({ error: barsError });

  if (name !== undefined && (typeof name !== 'string' || name.trim() === ''))
    return res.status(400).json({ error: 'name must be a non-empty string' });

  tablatures[index] = {
    ...existing,
    name: name !== undefined ? name.trim() : existing.name,
    timeSignature: updatedTs,
    bars: updatedBars,
    updatedAt: new Date().toISOString(),
  };
  res.json(tablatures[index]);
});

// DELETE /api/tablatures/:id
router.delete('/:id', (req, res) => {
  const index = tablatures.findIndex(t => t.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Tablature not found' });
  tablatures.splice(index, 1);
  res.json({ success: true });
});

module.exports = router;
