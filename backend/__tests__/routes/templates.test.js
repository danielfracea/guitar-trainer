'use strict';

const express = require('express');
const request = require('supertest');
const router = require('../../routes/templates');

const app = express();
app.use(express.json());
app.use('/templates', router);

describe('GET /templates', () => {
  test('returns 200 with array of 5 templates', async () => {
    const res = await request(app).get('/templates');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(5);
  });

  test('each template has required fields', async () => {
    const res = await request(app).get('/templates');
    res.body.forEach(t => {
      expect(t).toHaveProperty('id');
      expect(t).toHaveProperty('name');
      expect(t).toHaveProperty('description');
      expect(t).toHaveProperty('totalDuration');
      expect(t).toHaveProperty('exercises');
      expect(Array.isArray(t.exercises)).toBe(true);
    });
  });
});

describe('GET /templates/:id', () => {
  test('returns template for id 1', async () => {
    const res = await request(app).get('/templates/1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
    expect(res.body.name).toBe('Beginner Foundations');
  });

  test('returns template for id 5', async () => {
    const res = await request(app).get('/templates/5');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(5);
    expect(res.body.name).toBe('Full Daily Routine');
  });

  test('returns 404 for unknown id', async () => {
    const res = await request(app).get('/templates/999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
