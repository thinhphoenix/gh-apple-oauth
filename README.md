# Apple-only GitHub OAuth

Apple sign-in via GitHub OAuth -- no Apple Developer account needed.

This repo contains:
- **`lib/gh-apple-oauth/`** -- the standalone npm library ([README](lib/gh-apple-oauth/README.md))
- **`src/`** -- an Elysia demo app showing how to use it

## Library Usage

```bash
npm install gh-apple-oauth
```

```ts
import { GhAppleOAuth } from "gh-apple-oauth";

const auth = new GhAppleOAuth({
  clientId: "your_github_client_id",
  clientSecret: "your_github_client_secret",
  redirectUri: "http://localhost:3000/callback",
});

// Redirect user to Apple sign-in
const { url, state } = auth.createAuthUrl();

// In your callback, exchange code for profile
const result = await auth.authenticate(code);
```

See the [library README](lib/gh-apple-oauth/README.md) for Express, Hono, Next.js examples and full API docs.

## Demo App (Elysia)

### Environment

```bash
cp .env.example .env
# Fill in your GitHub OAuth App credentials
```

```
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_REDIRECT_URI=http://localhost:3000/auth/apple/callback
```

### Run

```bash
bun install
bun run dev
```

### Routes

- `GET /auth/apple` -- start Apple-only sign-in through GitHub
- `GET /auth/apple/callback` -- GitHub OAuth callback
