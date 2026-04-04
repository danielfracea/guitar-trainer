'use strict';

const express = require('express');
const request = require('supertest');

// Use isolateModules so each test file gets a fresh sessions store
let app;

beforeEach(() => {
  jest.resetModules();
  const freshRouter = require('../../routes/sessions');
  app = express();
  app.use(express.json());
  app.use('/sessions', freshRouter);
});

describe('GET /sessions', () => {
  test('returns 200 with empty array initially', async () => {
    const res = await request(app).get('/sessions');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /sessions', () => {
  test('creates a session and returns 201', async () => {
    const res = await request(app).post('/sessions').send({
      date: '2024-06-01T10:00:00.000Z',
      notes: 'good session',
      totalDuration: 30,
      mood: 'good',
    });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.notes).toBe('good session');
    expect(res.body.totalDuration).toBe(30);
    expect(res.body.mood).toBe('good');
  });

  test('defaults completed to true', async () => {
    const res = await request(app).post('/sessions').send({});
    expect(res.status).toBe(201);
    expect(res.body.completed).toBe(true);
  });

  test('returns 400 for invalid date', async () => {
    const res = await request(app).post('/sessions').send({ date: 'not-a-date' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 for negative totalDuration', async () => {
    const res = await request(app).post('/sessions').send({ totalDuration: -5 });
    expect(res.status).toBe(400);
  });

  test('returns 400 for string totalDuration', async () => {
    const res = await request(app).post('/sessions').send({ totalDuration: 'thirty' });
    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid mood', async () => {
    const res = await request(app).post('/sessions').send({ mood: 'amazing' });
    expect(res.status).toBe(400);
  });

  test('accepts all valid moods', async () => {
    for (const mood of ['great', 'good', 'okay', 'tough']) {
      const res = await request(app).post('/sessions').send({ mood });
      expect(res.status).toBe(201);
      expect(res.body.mood).toBe(mood);
    }
  });
});

describe('GET /sessions/:id', () => {
  test('returns 404 for unknown id', async () => {
    const res = await request(app).get('/sessions/999');
    expect(res.status).toBe(404);
  });

  test('returns the created session', async () => {
    const created = await request(app).post('/sessions').send({ notes: 'test' });
    const res = await request(app).get(`/sessions/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
    expect(res.body.notes).toBe('test');
  });
});

describe('PUT /sessions/:id', () => {
  test('updates fields and returns updated session', async () => {
    const created = await request(app).post('/sessions').send({ notes: 'original' });
    const res = await request(app)
      .put(`/sessions/${created.body.id}`)
      .send({ notes: 'updated', mood: 'great', totalDuration: 45 });
    expect(res.status).toBe(200);
    expect(res.body.notes).toBe('updated');
    expect(res.body.mood).toBe('great');
    expect(res.body.totalDuration).toBe(45);
  });

  test('returns 404 for unknown id', async () => {
    const res = await request(app).put('/sessions/999').send({ notes: 'x' });
    expect(res.status).toBe(404);
  });

  test('returns 400 for invalid mood on update', async () => {
    const created = await request(app).post('/sessions').send({});
    const res = await request(app)
      .put(`/sessions/${created.body.id}`)
      .send({ mood: 'fantastic' });
    expect(res.status).toBe(400);
  });

  test('returns 400 for negative totalDuration on update', async () => {
    const created = await request(app).post('/sessions').send({});
    const res = await request(app)
      .put(`/sessions/${created.body.id}`)
      .send({ totalDuration: -10 });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /sessions/:id', () => {
  test('deletes session and returns success', async () => {
    const created = await request(app).post('/sessions').send({});
    const res = await request(app).delete(`/sessions/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('returns 404 after deletion', async () => {
    const created = await request(app).post('/sessions').send({});
    await request(app).delete(`/sessions/${created.body.id}`);
    const res = await request(app).get(`/sessions/${created.body.id}`);
    expect(res.status).toBe(404);
  });

  test('returns 404 for unknown id', async () => {
    const res = await request(app).delete('/sessions/999');
    expect(res.status).toBe(404);
  });
});
