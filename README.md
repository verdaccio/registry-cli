# @verdaccio/ctl

CLI tool for [Verdaccio](https://verdaccio.org) registries — non-interactive login, user info with groups, and health checks.

Zero dependencies. Works with any Verdaccio auth plugin (htpasswd, LDAP, Azure AD, etc.).

## Installation

```bash
# Use directly with npx
npx @verdaccio/ctl login -u admin -p secret

# Or install globally
npm install -g @verdaccio/ctl
```

## Commands

### `login` — Authenticate to a registry

Non-interactive login — ideal for CI/CD pipelines.

```bash
# Username + password
verdaccioctl login -u admin -p secret -r http://localhost:4873

# With email
verdaccioctl login -u admin -p secret -e admin@company.com -r http://localhost:4873

# Token-based (Azure AD, OIDC, JWT)
verdaccioctl login --token eyJhbGciOi... -r http://localhost:4873
```

The token is written to `~/.npmrc` automatically.

### `whoami` — Show current user and groups

```bash
verdaccioctl whoami -r http://localhost:4873
# Username: admin
# Groups:   admins, developers
# Registry: http://localhost:4873
```

### `ping` — Check if registry is reachable

```bash
verdaccioctl ping -r http://localhost:4873
# Registry: http://localhost:4873
# Status:   OK
# Time:     12ms
```

Returns exit code 1 if unreachable — useful in CI health checks.

## Options

| Option              | Short | Description                                        |
| ------------------- | ----- | -------------------------------------------------- |
| `--registry <url>`  | `-r`  | Registry URL (default: `http://localhost:4873`)    |
| `--username <user>` | `-u`  | Username (login only)                              |
| `--password <pass>` | `-p`  | Password (login only)                              |
| `--email <email>`   | `-e`  | Email (login only, optional)                       |
| `--token <token>`   | —     | Pre-existing token for login (JWT, Azure AD, etc.) |
| `--help`            | `-h`  | Show help                                          |

## CI/CD Examples

### GitHub Actions

```yaml
- name: Login to Verdaccio
  run: npx @verdaccio/ctl login -u ${{ secrets.NPM_USER }} -p ${{ secrets.NPM_PASS }} -r https://registry.company.com

- name: Publish
  run: npm publish --registry https://registry.company.com
```

### Azure DevOps

```yaml
- script: npx @verdaccio/ctl login -u $(NPM_USER) -p $(NPM_PASS) -r https://registry.company.com
  displayName: Login to Verdaccio

- script: npm publish --registry https://registry.company.com
  displayName: Publish package
```

### GitLab CI

```yaml
publish:
  script:
    - npx @verdaccio/ctl login -u $NPM_USER -p $NPM_PASS -r https://registry.company.com
    - npm publish --registry https://registry.company.com
```

### Docker / Shell Scripts

```bash
#!/bin/bash
# Health check before publishing
verdaccioctl ping -r http://registry:4873 || exit 1

# Login
verdaccioctl login -u deploy -p "$DEPLOY_PASSWORD" -r http://registry:4873

# Verify identity
verdaccioctl whoami -r http://registry:4873

# Publish
npm publish --registry http://registry:4873
```

### Azure AD token login

```bash
# Get token from Azure CLI
TOKEN=$(az account get-access-token --resource api://your-client-id --query accessToken -o tsv)

# Login with token
verdaccioctl login --token "$TOKEN" -r https://registry.company.com
```

## Programmatic API

All commands are also exported as functions:

```typescript
import {login, loginWithToken, whoami, ping} from '@verdaccio/ctl';

await login({username: 'admin', password: 'secret', registry: 'http://localhost:4873'});
await loginWithToken('eyJhbG...', 'http://localhost:4873');
const user = await whoami('http://localhost:4873');
const health = await ping('http://localhost:4873');
```

## License

MIT
