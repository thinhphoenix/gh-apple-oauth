# Apple-only GitHub OAuth (Elysia)

## Environment
Create these environment variables before running:

```bash
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_REDIRECT_URI=http://localhost:3000/auth/apple/callback
```

## Development

```bash
bun run dev
```

## Routes

- `GET /auth/apple`: start Apple-only sign in through GitHub
- `GET /auth/apple/callback`: GitHub OAuth callback
