import {describe, test, expect, vi, beforeEach} from 'vitest';
import {ping} from '../src/commands/ping';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns ok when registry is reachable', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '{}',
    });

    const result = await ping('http://localhost:4873');
    expect(result.ok).toBe(true);
    expect(result.registry).toBe('http://localhost:4873');
    expect(result.responseTime).toBeGreaterThanOrEqual(0);
  });

  test('returns not ok on server error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    const result = await ping('http://localhost:4873');
    expect(result.ok).toBe(false);
  });

  test('returns not ok when unreachable', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const result = await ping('http://localhost:9999');
    expect(result.ok).toBe(false);
    expect(result.registry).toBe('http://localhost:9999');
  });
});
