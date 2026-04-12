import {existsSync, readFileSync} from 'fs';
import {join} from 'path';
import {homedir} from 'os';

interface WhoamiResult {
  username: string;
  groups?: string[];
}

export async function whoami(registry: string, token?: string): Promise<WhoamiResult> {
  const registryUrl = registry.replace(/\/$/, '');

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    // Try to read token from .npmrc
    const npmrcToken = readTokenFromNpmrc(registryUrl);
    if (npmrcToken) {
      headers['Authorization'] = `Bearer ${npmrcToken}`;
    }
  }

  const response = await fetch(`${registryUrl}/-/whoami`, {headers});

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Not logged in. Run `verdaccio-cli login` first.');
    }
    throw new Error(`Whoami failed (${response.status})`);
  }

  const data = await response.json();

  const result: WhoamiResult = {
    username: data.username,
  };

  // Try to get user details including groups
  try {
    const userInfoResponse = await fetch(
      `${registryUrl}/-/user/org.couchdb.user:${encodeURIComponent(data.username)}`,
      {headers}
    );
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json();
      if (userInfo.groups) {
        result.groups = userInfo.groups;
      }
    }
  } catch {
    // groups info not available — that's fine
  }

  console.log(`Username: ${result.username}`);
  if (result.groups && result.groups.length > 0) {
    console.log(`Groups:   ${result.groups.join(', ')}`);
  }
  console.log(`Registry: ${registryUrl}`);

  return result;
}

function readTokenFromNpmrc(registryUrl: string): string | undefined {
  const npmrcPath = join(homedir(), '.npmrc');
  if (!existsSync(npmrcPath)) {
    return undefined;
  }

  const registryWithoutProtocol = registryUrl.replace(/^https?:/, '');
  const content = readFileSync(npmrcPath, 'utf8');
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.startsWith(`${registryWithoutProtocol}/:_authToken`)) {
      const match = line.match(/_authToken[=\s]+"?([^"\s]+)"?/);
      if (match) {
        return match[1];
      }
    }
  }

  return undefined;
}
