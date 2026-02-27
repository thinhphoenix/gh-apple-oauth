import { GhAppleOAuthError } from "./errors";
import type {
  GhAppleOAuthConfig,
  AuthUrlResult,
  GithubAccessTokenResponse,
  GithubProfile,
  AuthResult,
} from "./types";

const GITHUB_TOKEN_ENDPOINT = "https://github.com/login/oauth/access_token";
const GITHUB_USER_ENDPOINT = "https://api.github.com/user";
const GITHUB_USER_EMAILS_ENDPOINT = "https://api.github.com/user/emails";
const GITHUB_APPLE_INITIATE = "https://github.com/sessions/social/apple/initiate";

const DEFAULT_SCOPES = ["read:user", "user:email"];

// ---------------------------------------------------------------------------
// Standalone helpers (exported for functional usage)
// ---------------------------------------------------------------------------

/** Generate a cryptographically random OAuth state string. */
export function createState(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

/**
 * Build the full Apple-via-GitHub authorization URL.
 *
 * @returns The URL to redirect the user to and the state token to verify later.
 */
export function createAuthUrl(opts: {
  clientId: string;
  redirectUri: string;
  scopes?: string[];
  allowSignup?: boolean;
  disableSignup?: boolean;
  state?: string;
}): AuthUrlResult {
  const state = opts.state ?? createState();
  const scopes = opts.scopes ?? DEFAULT_SCOPES;

  const authorizePath =
    "/login/oauth/authorize?" +
    new URLSearchParams({
      client_id: opts.clientId,
      redirect_uri: opts.redirectUri,
      scope: scopes.join(" "),
      state,
      allow_signup: String(opts.allowSignup ?? false),
    }).toString();

  const url =
    GITHUB_APPLE_INITIATE +
    "?" +
    new URLSearchParams({
      disable_signup: String(opts.disableSignup ?? true),
      return_to: authorizePath,
    }).toString();

  return { url, state };
}

/**
 * Exchange a GitHub OAuth authorization code for an access token.
 *
 * @returns The access token string.
 * @throws {GhAppleOAuthError} If the exchange fails.
 */
export async function exchangeCode(opts: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  code: string;
}): Promise<string> {
  const response = await fetch(GITHUB_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: opts.clientId,
      client_secret: opts.clientSecret,
      code: opts.code,
      redirect_uri: opts.redirectUri,
    }),
  });

  const payload = (await response.json()) as GithubAccessTokenResponse;

  if (!response.ok || !payload.access_token) {
    const message =
      payload.error_description ??
      payload.error ??
      "Unable to exchange code for access token";
    throw new GhAppleOAuthError("token_exchange_failed", message);
  }

  return payload.access_token;
}

/**
 * Fetch the GitHub user profile and verified emails for a given access token.
 *
 * @throws {GhAppleOAuthError} If the API request fails.
 */
export async function getProfile(accessToken: string): Promise<GithubProfile> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
  };

  const [userRes, emailsRes] = await Promise.all([
    fetch(GITHUB_USER_ENDPOINT, { headers }),
    fetch(GITHUB_USER_EMAILS_ENDPOINT, { headers }),
  ]);

  if (!userRes.ok) {
    throw new GhAppleOAuthError(
      "profile_fetch_failed",
      `GitHub user endpoint returned ${userRes.status}`
    );
  }

  if (!emailsRes.ok) {
    throw new GhAppleOAuthError(
      "emails_fetch_failed",
      `GitHub emails endpoint returned ${emailsRes.status}`
    );
  }

  const user = (await userRes.json()) as GithubProfile["user"];
  const emails = (await emailsRes.json()) as GithubProfile["emails"];

  return { user, emails };
}

// ---------------------------------------------------------------------------
// Class-based client
// ---------------------------------------------------------------------------

/**
 * Apple OAuth via GitHub - zero-dependency, framework-agnostic client.
 *
 * Uses GitHub's undocumented `/sessions/social/apple/initiate` endpoint to
 * skip the "choose login method" screen and go straight to Apple sign-in.
 * No Apple Developer account required -- GitHub acts as the Apple OIDC client.
 *
 * @example
 * ```ts
 * import { GhAppleOAuth } from "gh-apple-oauth";
 *
 * const auth = new GhAppleOAuth({
 *   clientId: "your_github_client_id",
 *   clientSecret: "your_github_client_secret",
 *   redirectUri: "http://localhost:3000/callback",
 * });
 *
 * // 1. Redirect user to Apple sign-in
 * const { url, state } = auth.createAuthUrl();
 *
 * // 2. In your callback handler
 * const result = await auth.authenticate(code);
 * ```
 */
export class GhAppleOAuth {
  private readonly config: Required<
    Pick<GhAppleOAuthConfig, "clientId" | "clientSecret" | "redirectUri">
  > &
    GhAppleOAuthConfig;

  constructor(config: GhAppleOAuthConfig) {
    if (!config.clientId) throw new GhAppleOAuthError("config_invalid", "clientId is required");
    if (!config.clientSecret) throw new GhAppleOAuthError("config_invalid", "clientSecret is required");
    if (!config.redirectUri) throw new GhAppleOAuthError("config_invalid", "redirectUri is required");

    this.config = config;
  }

  /**
   * Generate the Apple-via-GitHub authorization URL and a CSRF state token.
   *
   * Store `state` in a cookie or session, then redirect the user to `url`.
   */
  createAuthUrl(state?: string): AuthUrlResult {
    return createAuthUrl({
      clientId: this.config.clientId,
      redirectUri: this.config.redirectUri,
      scopes: this.config.scopes,
      allowSignup: this.config.allowSignup,
      disableSignup: this.config.disableSignup,
      state,
    });
  }

  /**
   * Exchange an authorization code (received in your callback) for a GitHub access token.
   *
   * @returns The access token string.
   */
  async exchangeCode(code: string): Promise<string> {
    return exchangeCode({
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
      redirectUri: this.config.redirectUri,
      code,
    });
  }

  /**
   * Fetch the GitHub profile (user + emails) for a given access token.
   */
  async getProfile(accessToken: string): Promise<GithubProfile> {
    return getProfile(accessToken);
  }

  /**
   * Convenience method: exchange the code **and** fetch the profile in one call.
   *
   * @returns Full auth result including the access token and profile data.
   */
  async authenticate(code: string): Promise<AuthResult> {
    const accessToken = await this.exchangeCode(code);
    const { user, emails } = await this.getProfile(accessToken);

    return {
      provider: "github",
      method: "apple",
      accessToken,
      user,
      emails,
    };
  }
}
