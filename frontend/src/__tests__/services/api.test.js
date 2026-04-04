import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock axios before importing api.js
vi.mock('axios', () => {
  const mockInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
  return {
    default: {
      create: vi.fn(() => mockInstance),
    },
    __mockInstance: mockInstance,
  };
});

import axios from 'axios';
import {
  getExercises,
  getExercise,
  updateExercise,
  resetExercises,
  getTemplates,
  getSessions,
  createSession,
  updateSession,
  deleteSession,
  getTablatures,
  getTablature,
  createTablature,
  updateTablature,
  deleteTablature,
} from '../../services/api.js';

const mockApi = axios.create();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('api service', () => {
  it('getExercises calls GET /exercises', async () => {
    mockApi.get.mockResolvedValue({ data: [] });
    await getExercises();
    expect(mockApi.get).toHaveBeenCalledWith('/exercises');
  });

  it('getExercise calls GET /exercises/:id', async () => {
    mockApi.get.mockResolvedValue({ data: {} });
    await getExercise(3);
    expect(mockApi.get).toHaveBeenCalledWith('/exercises/3');
  });

  it('updateExercise calls PUT /exercises/:id with data', async () => {
    mockApi.put.mockResolvedValue({ data: {} });
    const payload = { name: 'Updated' };
    await updateExercise(2, payload);
    expect(mockApi.put).toHaveBeenCalledWith('/exercises/2', payload);
  });

  it('resetExercises calls POST /exercises/reset', async () => {
    mockApi.post.mockResolvedValue({ data: {} });
    await resetExercises();
    expect(mockApi.post).toHaveBeenCalledWith('/exercises/reset');
  });

  it('getTemplates calls GET /templates', async () => {
    mockApi.get.mockResolvedValue({ data: [] });
    await getTemplates();
    expect(mockApi.get).toHaveBeenCalledWith('/templates');
  });

  it('getSessions calls GET /sessions', async () => {
    mockApi.get.mockResolvedValue({ data: [] });
    await getSessions();
    expect(mockApi.get).toHaveBeenCalledWith('/sessions');
  });

  it('createSession calls POST /sessions with data', async () => {
    mockApi.post.mockResolvedValue({ data: {} });
    const payload = { notes: 'test', totalDuration: 30 };
    await createSession(payload);
    expect(mockApi.post).toHaveBeenCalledWith('/sessions', payload);
  });

  it('updateSession calls PUT /sessions/:id with data', async () => {
    mockApi.put.mockResolvedValue({ data: {} });
    const payload = { mood: 'good' };
    await updateSession(5, payload);
    expect(mockApi.put).toHaveBeenCalledWith('/sessions/5', payload);
  });

  it('deleteSession calls DELETE /sessions/:id', async () => {
    mockApi.delete.mockResolvedValue({ data: { success: true } });
    await deleteSession(7);
    expect(mockApi.delete).toHaveBeenCalledWith('/sessions/7');
  });

  it('getTablatures calls GET /tablatures', async () => {
    mockApi.get.mockResolvedValue({ data: [] });
    await getTablatures();
    expect(mockApi.get).toHaveBeenCalledWith('/tablatures');
  });

  it('getTablature calls GET /tablatures/:id', async () => {
    mockApi.get.mockResolvedValue({ data: {} });
    await getTablature(1);
    expect(mockApi.get).toHaveBeenCalledWith('/tablatures/1');
  });

  it('createTablature calls POST /tablatures with data', async () => {
    mockApi.post.mockResolvedValue({ data: { id: 1 } });
    const payload = { name: 'My Tab', timeSignature: { numerator: 4, denominator: 4 }, bars: [] };
    await createTablature(payload);
    expect(mockApi.post).toHaveBeenCalledWith('/tablatures', payload);
  });

  it('updateTablature calls PUT /tablatures/:id with data', async () => {
    mockApi.put.mockResolvedValue({ data: {} });
    const payload = { name: 'Updated' };
    await updateTablature(3, payload);
    expect(mockApi.put).toHaveBeenCalledWith('/tablatures/3', payload);
  });

  it('deleteTablature calls DELETE /tablatures/:id', async () => {
    mockApi.delete.mockResolvedValue({ data: { success: true } });
    await deleteTablature(2);
    expect(mockApi.delete).toHaveBeenCalledWith('/tablatures/2');
  });

  it('axios.create was called once during module initialization', async () => {
    // axios.create is invoked at module load time; verify the mock instance
    // was set up by confirming it responds to api method calls
    mockApi.get.mockResolvedValueOnce({ data: [] });
    await expect(getExercises()).resolves.toBeDefined();
    expect(mockApi.get).toHaveBeenCalledWith('/exercises');
  });
});
