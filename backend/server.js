const express = require('express');
const cors = require('cors');
const exercisesRouter = require('./routes/exercises');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/exercises', exercisesRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Guitar Trainer API running on http://localhost:${PORT}`);
});
