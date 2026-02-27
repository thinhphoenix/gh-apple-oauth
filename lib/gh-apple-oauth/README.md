# gh-apple-oauth

Apple OAuth via GitHub -- zero dependencies, works everywhere.

Uses GitHub's `/sessions/social/apple/initiate` endpoint to skip the "choose login method" screen and go **straight to Apple sign-in**. No Apple Developer account required -- GitHub acts as the Apple OIDC relay.

## Install

```bash
npm install gh-apple-oauth
# or
bun add gh-apple-oauth
# or
pnpm add gh-apple-oauth
# or
yarn add gh-apple-oauth
```

## Prerequisites

1. Create a [GitHub OAuth App](https://github.com/settings/applications/new)
2. Set the callback URL to your server's callback endpoint
3. Note your **Client ID** and **Client Secret**

## Quick Start

### Class API (recommended)

```ts
import { GhAppleOAuth } from "gh-apple-oauth";

const auth = new GhAppleOAuth({
  clientId: "your_github_client_id",
  clientSecret: "your_github_client_secret",
  redirectUri: "http://localhost:3000/callback",
});

// 1. Generate the Apple login URL
const { url, state } = auth.createAuthUrl();
// Store `state` in a cookie/session, then redirect the user to `url`

// 2. In your callback handler, exchange the code
const result = await auth.authenticate(code);
// result = { provider, method, accessToken, user, emails }
```

### Functional API

```ts
import { createAuthUrl, exchangeCode, getProfile } from "gh-apple-oauth";

// 1. Build the auth URL
const { url, state } = createAuthUrl({
  clientId: "your_github_client_id",
  redirectUri: "http://localhost:3000/callback",
});

// 2. Exchange the callback code for an access token
const accessToken = await exchangeCode({
  clientId: "your_github_client_id",
  clientSecret: "your_github_client_secret",
  redirectUri: "http://localhost:3000/callback",
  code: callbackCode,
});

// 3. Fetch the user profile
const { user, emails } = await getProfile(accessToken);
```

## Framework Examples

### Express

```ts
import express from "express";
import { GhAppleOAuth } from "gh-apple-oauth";

const app = express();
const auth = new GhAppleOAuth({
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  redirectUri: "http://localhost:3000/auth/callback",
});

app.get("/auth/apple", (req, res) => {
  const { url, state } = auth.createAuthUrl();
  res.cookie("oauth_state", state, { httpOnly: true, sameSite: "lax" });
  res.redirect(url);
});

app.get("/auth/callback", async (req, res) => {
  const { code, state } = req.query;
  if (state !== req.cookies.oauth_state) return res.status(400).send("Bad state");
  const result = await auth.authenticate(code as string);
  res.json(result);
});
```

### Hono

```ts
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { GhAppleOAuth } from "gh-apple-oauth";

const app = new Hono();
const auth = new GhAppleOAuth({
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  redirectUri: "http://localhost:3000/auth/callback",
});

app.get("/auth/apple", (c) => {
  const { url, state } = auth.createAuthUrl();
  setCookie(c, "oauth_state", state, { httpOnly: true, sameSite: "Lax" });
  return c.redirect(url);
});

app.get("/auth/callback", async (c) => {
  const code = c.req.query("code")!;
  const state = c.req.query("state");
  if (state !== getCookie(c, "oauth_state")) return c.text("Bad state", 400);
  const result = await auth.authenticate(code);
  return c.json(result);
});
```

### Next.js (App Router)

```ts
// app/api/auth/apple/route.ts
import { NextResponse } from "next/server";
import { GhAppleOAuth } from "gh-apple-oauth";

const auth = new GhAppleOAuth({
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  redirectUri: process.env.GITHUB_REDIRECT_URI!,
});

export function GET() {
  const { url, state } = auth.createAuthUrl();
  const response = NextResponse.redirect(url);
  response.cookies.set("oauth_state", state, { httpOnly: true, sameSite: "lax" });
  return response;
}
```

```ts
// app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GhAppleOAuth } from "gh-apple-oauth";

const auth = new GhAppleOAuth({
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  redirectUri: process.env.GITHUB_REDIRECT_URI!,
});

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")!;
  const state = req.nextUrl.searchParams.get("state");
  const saved = req.cookies.get("oauth_state")?.value;
  if (state !== saved) return NextResponse.json({ error: "Bad state" }, { status: 400 });
  const result = await auth.authenticate(code);
  return NextResponse.json(result);
}
```

## Config Options

| Option | Type | Default | Description |
|---|---|---|---|
| `clientId` | `string` | **required** | GitHub OAuth App client ID |
| `clientSecret` | `string` | **required** | GitHub OAuth App client secret |
| `redirectUri` | `string` | **required** | Your callback URL |
| `scopes` | `string[]` | `["read:user", "user:email"]` | GitHub OAuth scopes |
| `allowSignup` | `boolean` | `false` | Allow new GitHub accounts |
| `disableSignup` | `boolean` | `true` | Disable signup on Apple flow |

## Response Shape

```ts
interface AuthResult {
  provider: "github";
  method: "apple";
  accessToken: string;
  user: {
    id: number;
    login: string;
    name: string | null;
    avatar_url: string;
    html_url: string;
    email: string | null;
  };
  emails: Array<{
    email: string;
    primary: boolean;
    verified: boolean;
    visibility: string | null;
  }>;
}
```

## Error Handling

```ts
import { GhAppleOAuth, GhAppleOAuthError } from "gh-apple-oauth";

try {
  const result = await auth.authenticate(code);
} catch (error) {
  if (error instanceof GhAppleOAuthError) {
    console.error(error.code);    // "token_exchange_failed" | "profile_fetch_failed" | ...
    console.error(error.message); // human-readable description
  }
}
```

## How It Works

```
Your Server                GitHub                      Apple
    |                         |                          |
    |-- redirect to --------->|                          |
    |   /sessions/social/     |                          |
    |   apple/initiate        |                          |
    |   ?return_to=           |                          |
    |   /login/oauth/         |                          |
    |   authorize?...         |                          |
    |                         |-- redirect to ---------->|
    |                         |   appleid.apple.com      |
    |                         |   /auth/authorize        |
    |                         |                          |
    |                         |   (user signs in)        |
    |                         |                          |
    |                         |<-- POST code ------------|
    |                         |                          |
    |<-- redirect with -------|                          |
    |   ?code=GITHUB_CODE     |                          |
    |                         |                          |
    |-- POST code ----------->|                          |
    |   /login/oauth/         |                          |
    |   access_token          |                          |
    |                         |                          |
    |<-- access_token --------|                          |
    |                         |                          |
    |-- GET /user ----------->|                          |
    |<-- profile + emails ----|                          |
```

## License

MIT
