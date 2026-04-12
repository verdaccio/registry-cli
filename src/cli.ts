#!/usr/bin/env node

import {parseArgs} from 'node:util';

import {login, loginWithToken} from './commands/login.js';
import {whoami} from './commands/whoami.js';
import {ping} from './commands/ping.js';

const HELP = `
verdaccioctl — CLI tool for Verdaccio registries

Usage:
  verdaccioctl <command> [options]

Commands:
  login       Authenticate to a Verdaccio registry (non-interactive)
  whoami      Show the current authenticated user and groups
  ping        Check if a registry is reachable

Options:
  -r, --registry <url>   Registry URL (default: http://localhost:4873)
  -h, --help             Show this help message

Login options:
  -u, --username <user>  Username
  -p, --password <pass>  Password
  -e, --email <email>    Email (optional, defaults to user@verdaccio.local)
  --token <token>        Login with a pre-existing token (JWT, Azure AD, etc.)

Examples:
  verdaccioctl login -u admin -p secret -r http://localhost:4873
  verdaccioctl login --token eyJhbG... -r http://localhost:4873
  verdaccioctl whoami -r http://localhost:4873
  verdaccioctl ping -r http://localhost:4873
`;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '-h' || command === '--help' || command === 'help') {
    process.stdout.write(HELP.trim() + '\n');
    process.exit(0);
  }

  // Parse remaining args (skip the command)
  const {values} = parseArgs({
    args: args.slice(1),
    options: {
      registry: {type: 'string', short: 'r', default: 'http://localhost:4873'},
      username: {type: 'string', short: 'u'},
      password: {type: 'string', short: 'p'},
      email: {type: 'string', short: 'e'},
      token: {type: 'string'},
      help: {type: 'boolean', short: 'h'},
    },
    strict: true,
  });

  if (values.help) {
    process.stdout.write(HELP.trim() + '\n');
    process.exit(0);
  }

  const registry = values.registry as string;

  try {
    switch (command) {
      case 'login': {
        if (values.token) {
          await loginWithToken(values.token as string, registry);
        } else {
          if (!values.username || !values.password) {
            console.error('Error: --username (-u) and --password (-p) are required for login');
            console.error('  Or use --token for token-based login');
            process.exit(1);
          }
          await login({
            username: values.username as string,
            password: values.password as string,
            email: values.email as string | undefined,
            registry,
          });
        }
        break;
      }
      case 'whoami': {
        await whoami(registry, values.token as string | undefined);
        break;
      }
      case 'ping': {
        const result = await ping(registry);
        if (!result.ok) {
          process.exit(1);
        }
        break;
      }
      default: {
        console.error(`Unknown command: ${command}`);
        console.error('Run verdaccioctl --help for usage');
        process.exit(1);
      }
    }
  } catch (err: unknown) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

void main();
