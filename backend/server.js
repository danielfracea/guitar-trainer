const express = require('express');
const path = require('path');
const cors = require('cors');
const exercisesRouter = require('./routes/exercises');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Serve API routes
app.use('/api/exercises', exercisesRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Guitar Trainer running on http://localhost:${PORT}`);
});
