import {writeFileSync, readFileSync, existsSync} from 'fs';
import {join} from 'path';
import {homedir} from 'os';

interface LoginOptions {
  username: string;
  password: string;
  email?: string;
  registry: string;
}

export async function login(options: LoginOptions): Promise<void> {
  const {username, password, registry} = options;
  const email = options.email || `${username}@verdaccio.local`;

  const registryUrl = registry.replace(/\/$/, '');

  // Call Verdaccio's /-/user/org.couchdb.user: endpoint
  const userPayload = {
    name: username,
    password,
    email,
  };

  const url = `${registryUrl}/-/user/org.couchdb.user:${encodeURIComponent(username)}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(userPayload),
  });

  if (!response.ok) {
    const body = await response.text();
    let message: string;
    try {
      const json = JSON.parse(body);
      message = json.error || json.message || body;
    } catch {
      message = body;
    }
    throw new Error(`Login failed (${response.status}): ${message}`);
  }

  const data = await response.json();
  const token = data.token || data.ok;

  if (!token || token === true) {
    throw new Error('Login succeeded but no token was returned');
  }

  // Write token to .npmrc
  const registryWithoutProtocol = registryUrl.replace(/^https?:/, '');
  const npmrcLine = `${registryWithoutProtocol}/:_authToken="${token}"`;

  const npmrcPath = join(homedir(), '.npmrc');
  let npmrcContent = '';

  if (existsSync(npmrcPath)) {
    npmrcContent = readFileSync(npmrcPath, 'utf8');
    // Remove existing entry for this registry
    const lines = npmrcContent
      .split('\n')
      .filter((line) => !line.startsWith(`${registryWithoutProtocol}/:_authToken`));
    npmrcContent = lines.join('\n');
  }

  // Append new token
  npmrcContent = npmrcContent.trimEnd() + '\n' + npmrcLine + '\n';
  writeFileSync(npmrcPath, npmrcContent, 'utf8');

  process.stdout.write(`Logged in as ${username} to ${registryUrl}\n`);
  process.stdout.write(`Token written to ${npmrcPath}\n`);
}

export async function loginWithToken(token: string, registry: string): Promise<void> {
  const registryUrl = registry.replace(/\/$/, '');

  // Verify the token works by calling whoami
  const response = await fetch(`${registryUrl}/-/whoami`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Token verification failed (${response.status})`);
  }

  const data = await response.json();
  const username = data.username;

  // Write token to .npmrc
  const registryWithoutProtocol = registryUrl.replace(/^https?:/, '');
  const npmrcLine = `${registryWithoutProtocol}/:_authToken="${token}"`;

  const npmrcPath = join(homedir(), '.npmrc');
  let npmrcContent = '';

  if (existsSync(npmrcPath)) {
    npmrcContent = readFileSync(npmrcPath, 'utf8');
    const lines = npmrcContent
      .split('\n')
      .filter((line) => !line.startsWith(`${registryWithoutProtocol}/:_authToken`));
    npmrcContent = lines.join('\n');
  }

  npmrcContent = npmrcContent.trimEnd() + '\n' + npmrcLine + '\n';
  writeFileSync(npmrcPath, npmrcContent, 'utf8');

  process.stdout.write(`Logged in as ${username || '(token user)'} to ${registryUrl}\n`);
  process.stdout.write(`Token written to ${npmrcPath}\n`);
}
