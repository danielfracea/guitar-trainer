'use strict';

const express = require('express');
const request = require('supertest');

let app;

beforeEach(() => {
  jest.resetModules();
  const freshRouter = require('../../routes/tablatures');
  app = express();
  app.use(express.json());
  app.use('/tablatures', freshRouter);
});

const validTab = {
  name: 'Test Tab',
  timeSignature: { numerator: 4, denominator: 4 },
  bars: [
    {
      notes: [
        { e: '0', B: '', G: '', D: '', A: '', E: '' },
        { e: '', B: '2', G: '', D: '', A: '', E: '' },
        { e: '', B: '', G: '3', D: '', A: '', E: '' },
        { e: '', B: '', G: '', D: '5', A: '', E: '' },
      ],
    },
  ],
};

describe('GET /tablatures', () => {
  test('returns 200 with empty array initially', async () => {
    const res = await request(app).get('/tablatures');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns created tablatures', async () => {
    await request(app).post('/tablatures').send(validTab);
    const res = await request(app).get('/tablatures');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Test Tab');
  });
});

describe('POST /tablatures', () => {
  test('creates a tablature and returns 201', async () => {
    const res = await request(app).post('/tablatures').send(validTab);
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Test Tab');
    expect(res.body.timeSignature).toEqual({ numerator: 4, denominator: 4 });
    expect(res.body.bars).toHaveLength(1);
    expect(res.body.createdAt).toBeDefined();
    expect(res.body.updatedAt).toBeDefined();
  });

  test('accepts empty bars array', async () => {
    const res = await request(app).post('/tablatures').send({
      name: 'Empty Tab',
      timeSignature: { numerator: 4, denominator: 4 },
      bars: [],
    });
    expect(res.status).toBe(201);
    expect(res.body.bars).toEqual([]);
  });

  test('defaults bars to empty when omitted', async () => {
    const res = await request(app).post('/tablatures').send({
      name: 'No Bars',
      timeSignature: { numerator: 3, denominator: 4 },
    });
    expect(res.status).toBe(201);
    expect(res.body.bars).toEqual([]);
  });

  test('accepts 3/4 time signature', async () => {
    const res = await request(app).post('/tablatures').send({
      name: 'Waltz',
      timeSignature: { numerator: 3, denominator: 4 },
      bars: [
        {
          notes: [
            { e: '', B: '', G: '', D: '', A: '', E: '0' },
            { e: '', B: '', G: '', D: '', A: '', E: '2' },
            { e: '', B: '', G: '', D: '', A: '', E: '3' },
          ],
        },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.body.timeSignature.numerator).toBe(3);
  });

  test('accepts all valid denominators', async () => {
    for (const denom of [2, 4, 8, 16]) {
      const res = await request(app).post('/tablatures').send({
        name: `Tab ${denom}`,
        timeSignature: { numerator: 4, denominator: denom },
        bars: [],
      });
      expect(res.status).toBe(201);
    }
  });

  test('trims whitespace from name', async () => {
    const res = await request(app).post('/tablatures').send({
      name: '  Padded  ',
      timeSignature: { numerator: 4, denominator: 4 },
      bars: [],
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Padded');
  });

  test('returns 400 when name is missing', async () => {
    const res = await request(app).post('/tablatures').send({
      timeSignature: { numerator: 4, denominator: 4 },
    });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when name is empty string', async () => {
    const res = await request(app).post('/tablatures').send({
      name: '   ',
      timeSignature: { numerator: 4, denominator: 4 },
    });
    expect(res.status).toBe(400);
  });

  test('returns 400 when timeSignature is missing', async () => {
    const res = await request(app).post('/tablatures').send({ name: 'Test' });
    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid numerator (0)', async () => {
    const res = await request(app).post('/tablatures').send({
      name: 'Bad',
      timeSignature: { numerator: 0, denominator: 4 },
    });
    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid numerator (13)', async () => {
    const res = await request(app).post('/tablatures').send({
      name: 'Bad',
      timeSignature: { numerator: 13, denominator: 4 },
    });
    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid denominator', async () => {
    const res = await request(app).post('/tablatures').send({
      name: 'Bad',
      timeSignature: { numerator: 4, denominator: 3 },
    });
    expect(res.status).toBe(400);
  });

  test('returns 400 when bar notes count does not match numerator', async () => {
    const res = await request(app).post('/tablatures').send({
      name: 'Wrong beats',
      timeSignature: { numerator: 4, denominator: 4 },
      bars: [
        {
          notes: [
            { e: '', B: '', G: '', D: '', A: '', E: '' },
            { e: '', B: '', G: '', D: '', A: '', E: '' },
          ],
        },
      ],
    });
    expect(res.status).toBe(400);
  });

  test('returns 400 for fret value out of range (25)', async () => {
    const res = await request(app).post('/tablatures').send({
      name: 'Bad fret',
      timeSignature: { numerator: 1, denominator: 4 },
      bars: [
        {
          notes: [{ e: '25', B: '', G: '', D: '', A: '', E: '' }],
        },
      ],
    });
    expect(res.status).toBe(400);
  });

  test('accepts fret value 0', async () => {
    const res = await request(app).post('/tablatures').send({
      name: 'Open strings',
      timeSignature: { numerator: 1, denominator: 4 },
      bars: [
        {
          notes: [{ e: '0', B: '0', G: '0', D: '0', A: '0', E: '0' }],
        },
      ],
    });
    expect(res.status).toBe(201);
  });

  test('accepts fret value 24', async () => {
    const res = await request(app).post('/tablatures').send({
      name: 'High fret',
      timeSignature: { numerator: 1, denominator: 4 },
      bars: [
        {
          notes: [{ e: '24', B: '', G: '', D: '', A: '', E: '' }],
        },
      ],
    });
    expect(res.status).toBe(201);
  });
});

describe('GET /tablatures/:id', () => {
  test('returns 404 for unknown id', async () => {
    const res = await request(app).get('/tablatures/999');
    expect(res.status).toBe(404);
  });

  test('returns the created tablature', async () => {
    const created = await request(app).post('/tablatures').send(validTab);
    const res = await request(app).get(`/tablatures/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
    expect(res.body.name).toBe('Test Tab');
  });
});

describe('PUT /tablatures/:id', () => {
  test('updates name and returns updated tablature', async () => {
    const created = await request(app).post('/tablatures').send(validTab);
    const res = await request(app)
      .put(`/tablatures/${created.body.id}`)
      .send({ name: 'Updated Tab' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Tab');
    expect(res.body.timeSignature).toEqual({ numerator: 4, denominator: 4 });
  });

  test('updates timeSignature and resizes bars', async () => {
    const created = await request(app).post('/tablatures').send(validTab);
    const res = await request(app)
      .put(`/tablatures/${created.body.id}`)
      .send({
        timeSignature: { numerator: 3, denominator: 4 },
        bars: [
          {
            notes: [
              { e: '0', B: '', G: '', D: '', A: '', E: '' },
              { e: '2', B: '', G: '', D: '', A: '', E: '' },
              { e: '3', B: '', G: '', D: '', A: '', E: '' },
            ],
          },
        ],
      });
    expect(res.status).toBe(200);
    expect(res.body.timeSignature.numerator).toBe(3);
  });

  test('returns 404 for unknown id', async () => {
    const res = await request(app).put('/tablatures/999').send({ name: 'x' });
    expect(res.status).toBe(404);
  });

  test('returns 400 for empty name on update', async () => {
    const created = await request(app).post('/tablatures').send(validTab);
    const res = await request(app)
      .put(`/tablatures/${created.body.id}`)
      .send({ name: '' });
    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid timeSignature on update', async () => {
    const created = await request(app).post('/tablatures').send(validTab);
    const res = await request(app)
      .put(`/tablatures/${created.body.id}`)
      .send({ timeSignature: { numerator: 0, denominator: 4 } });
    expect(res.status).toBe(400);
  });

  test('updates updatedAt timestamp', async () => {
    const created = await request(app).post('/tablatures').send(validTab);
    const original = created.body.updatedAt;
    await new Promise(r => setTimeout(r, 5));
    const res = await request(app)
      .put(`/tablatures/${created.body.id}`)
      .send({ name: 'New Name' });
    expect(res.body.updatedAt).not.toBe(original);
  });
});

describe('DELETE /tablatures/:id', () => {
  test('deletes tablature and returns success', async () => {
    const created = await request(app).post('/tablatures').send(validTab);
    const res = await request(app).delete(`/tablatures/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('returns 404 after deletion', async () => {
    const created = await request(app).post('/tablatures').send(validTab);
    await request(app).delete(`/tablatures/${created.body.id}`);
    const res = await request(app).get(`/tablatures/${created.body.id}`);
    expect(res.status).toBe(404);
  });

  test('returns 404 for unknown id', async () => {
    const res = await request(app).delete('/tablatures/999');
    expect(res.status).toBe(404);
  });
});
