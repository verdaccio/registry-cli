import {describe, test, expect, vi, beforeEach, afterEach} from 'vitest';
import {login, loginWithToken} from '../src/commands/login';

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock('fs', () => ({
  existsSync: vi.fn(() => false),
  readFileSync: vi.fn(() => ''),
  writeFileSync: vi.fn(),
}));

describe('login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('logs in with username and password', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({token: 'test-token-123'}),
    });

    await login({
      username: 'admin',
      password: 'secret',
      registry: 'http://localhost:4873',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:4873/-/user/org.couchdb.user:admin',
      expect.objectContaining({method: 'PUT'})
    );
  });

  test('throws on failed login', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({error: 'bad credentials'}),
    });

    await expect(
      login({username: 'bad', password: 'wrong', registry: 'http://localhost:4873'})
    ).rejects.toThrow('Login failed (401)');
  });

  test('throws when no token returned', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ok: true}),
    });

    await expect(
      login({username: 'user', password: 'pass', registry: 'http://localhost:4873'})
    ).rejects.toThrow('no token was returned');
  });
});

describe('loginWithToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('verifies token and writes to npmrc', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({username: 'tokenuser'}),
    });

    await loginWithToken('jwt-abc', 'http://localhost:4873');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:4873/-/whoami',
      expect.objectContaining({
        headers: {Authorization: 'Bearer jwt-abc'},
      })
    );
  });

  test('throws on invalid token', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    await expect(loginWithToken('bad-token', 'http://localhost:4873')).rejects.toThrow(
      'Token verification failed'
    );
  });
});
