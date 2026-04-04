'use strict';

let getSessions, getSession, addSession, updateSession, deleteSession;

beforeEach(() => {
  jest.resetModules();
  const mod = require('../../data/sessions');
  getSessions = mod.getSessions;
  getSession = mod.getSession;
  addSession = mod.addSession;
  updateSession = mod.updateSession;
  deleteSession = mod.deleteSession;
});

describe('getSessions', () => {
  test('returns empty array initially', () => {
    expect(getSessions()).toEqual([]);
  });

  test('returns sessions sorted by date descending', () => {
    addSession({ date: '2024-01-01T00:00:00.000Z' });
    addSession({ date: '2024-03-01T00:00:00.000Z' });
    addSession({ date: '2024-02-01T00:00:00.000Z' });
    const result = getSessions();
    expect(result[0].date).toBe('2024-03-01T00:00:00.000Z');
    expect(result[1].date).toBe('2024-02-01T00:00:00.000Z');
    expect(result[2].date).toBe('2024-01-01T00:00:00.000Z');
  });
});

describe('getSession', () => {
  test('returns null for non-existent id', () => {
    expect(getSession(999)).toBeNull();
  });

  test('returns the session with matching id', () => {
    const s = addSession({ notes: 'hello' });
    expect(getSession(s.id)).toEqual(s);
  });
});

describe('addSession', () => {
  test('assigns incrementing ids', () => {
    const s1 = addSession({});
    const s2 = addSession({});
    expect(s2.id).toBe(s1.id + 1);
  });

  test('uses provided date', () => {
    const date = '2024-06-15T12:00:00.000Z';
    const s = addSession({ date });
    expect(s.date).toBe(date);
  });

  test('defaults completed to true', () => {
    const s = addSession({});
    expect(s.completed).toBe(true);
  });

  test('respects completed: false', () => {
    const s = addSession({ completed: false });
    expect(s.completed).toBe(false);
  });

  test('defaults totalDuration to 0', () => {
    const s = addSession({});
    expect(s.totalDuration).toBe(0);
  });

  test('stores provided fields', () => {
    const s = addSession({
      templateId: 2,
      templateName: 'Chord Mastery',
      exercises: [{ exerciseId: 1, duration: 10 }],
      totalDuration: 30,
      notes: 'great session',
      mood: 'good',
    });
    expect(s.templateId).toBe(2);
    expect(s.templateName).toBe('Chord Mastery');
    expect(s.exercises).toHaveLength(1);
    expect(s.totalDuration).toBe(30);
    expect(s.notes).toBe('great session');
    expect(s.mood).toBe('good');
  });
});

describe('updateSession', () => {
  test('returns null for non-existent id', () => {
    expect(updateSession(999, { notes: 'x' })).toBeNull();
  });

  test('updates fields and preserves id', () => {
    const s = addSession({ notes: 'original' });
    const updated = updateSession(s.id, { notes: 'updated', mood: 'great' });
    expect(updated.id).toBe(s.id);
    expect(updated.notes).toBe('updated');
    expect(updated.mood).toBe('great');
  });

  test('updated session is returned by getSession', () => {
    const s = addSession({ notes: 'before' });
    updateSession(s.id, { notes: 'after' });
    expect(getSession(s.id).notes).toBe('after');
  });
});

describe('deleteSession', () => {
  test('returns false for non-existent id', () => {
    expect(deleteSession(999)).toBe(false);
  });

  test('returns true and removes the session', () => {
    const s = addSession({});
    expect(deleteSession(s.id)).toBe(true);
    expect(getSession(s.id)).toBeNull();
  });
});
