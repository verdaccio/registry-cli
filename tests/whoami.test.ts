import {describe, test, expect, vi, beforeEach} from 'vitest';
import {whoami} from '../src/commands/whoami';

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock('fs', () => ({
  existsSync: vi.fn(() => false),
  readFileSync: vi.fn(() => ''),
}));

describe('whoami', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns username from registry', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({username: 'admin'}),
      })
      .mockResolvedValueOnce({
        ok: false,
      });

    const result = await whoami('http://localhost:4873', 'my-token');
    expect(result.username).toBe('admin');
  });

  test('returns username and groups when available', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({username: 'admin'}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({groups: ['admins', 'developers']}),
      });

    const result = await whoami('http://localhost:4873', 'my-token');
    expect(result.username).toBe('admin');
    expect(result.groups).toEqual(['admins', 'developers']);
  });

  test('throws when not authenticated', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    await expect(whoami('http://localhost:4873', 'bad-token')).rejects.toThrow('Not logged in');
  });
});
