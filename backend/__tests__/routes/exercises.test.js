'use strict';

const express = require('express');
const request = require('supertest');

function makeApp() {
  const app = express();
  app.use(express.json());
  // Fresh require so module-level array is reset after POST /reset
  const router = require('../../routes/exercises');
  app.use('/exercises', router);
  return app;
}

const app = makeApp();

// Reset exercises to defaults before each test
beforeEach(async () => {
  await request(app).post('/exercises/reset');
});

describe('GET /exercises', () => {
  test('returns 200 with array of 5 exercises', async () => {
    const res = await request(app).get('/exercises');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(5);
  });

  test('each exercise has id, name, type, settings', async () => {
    const res = await request(app).get('/exercises');
    res.body.forEach(ex => {
      expect(ex).toHaveProperty('id');
      expect(ex).toHaveProperty('name');
      expect(ex).toHaveProperty('type');
      expect(ex).toHaveProperty('settings');
    });
  });
});

describe('GET /exercises/:id', () => {
  test('returns 200 with exercise for valid id', async () => {
    const res = await request(app).get('/exercises/1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
    expect(res.body.name).toBe('Scale Practice');
  });

  test('returns 404 for unknown id', async () => {
    const res = await request(app).get('/exercises/999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

describe('PUT /exercises/:id', () => {
  test('updates and returns the exercise', async () => {
    const res = await request(app)
      .put('/exercises/1')
      .send({ name: 'Updated Scale' });
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
    expect(res.body.name).toBe('Updated Scale');
  });

  test('does not change the id', async () => {
    const res = await request(app)
      .put('/exercises/2')
      .send({ id: 999, name: 'Hijacked' });
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(2);
  });

  test('returns 404 for unknown id', async () => {
    const res = await request(app).put('/exercises/999').send({ name: 'x' });
    expect(res.status).toBe(404);
  });
});

describe('POST /exercises/reset', () => {
  test('resets exercises back to defaults after mutation', async () => {
    await request(app).put('/exercises/1').send({ name: 'Changed' });
    const resetRes = await request(app).post('/exercises/reset');
    expect(resetRes.status).toBe(200);
    expect(resetRes.body.exercises[0].name).toBe('Scale Practice');
  });

  test('reset response includes message and exercises array', async () => {
    const res = await request(app).post('/exercises/reset');
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('exercises');
    expect(res.body.exercises).toHaveLength(5);
  });
});
