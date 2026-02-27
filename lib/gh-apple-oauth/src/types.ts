/** Configuration for the GhAppleOAuth client. */
export interface GhAppleOAuthConfig {
  /** GitHub OAuth App client ID. */
  clientId: string;

  /** GitHub OAuth App client secret. */
  clientSecret: string;

  /** Your OAuth callback URL (must match the one registered in your GitHub OAuth App). */
  redirectUri: string;

  /**
   * GitHub OAuth scopes to request.
   * @default ["read:user", "user:email"]
   */
  scopes?: string[];

  /**
   * Whether to allow new GitHub account creation during the OAuth flow.
   * @default false
   */
  allowSignup?: boolean;

  /**
   * Whether to disable signup on the Apple sign-in flow.
   * @default true
   */
  disableSignup?: boolean;
}

/** Result of creating an authorization URL. */
export interface AuthUrlResult {
  /** The full URL to redirect the user to (goes directly to Apple sign-in via GitHub). */
  url: string;

  /** The CSRF state token. Store this in a cookie or session and verify it in the callback. */
  state: string;
}

/** GitHub access token response from the token exchange endpoint. */
export interface GithubAccessTokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
  error_uri?: string;
}

/** GitHub user profile. */
export interface GithubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  email: string | null;
}

/** A GitHub email address entry. */
export interface GithubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

/** The result returned by getProfile(). */
export interface GithubProfile {
  user: GithubUser;
  emails: GithubEmail[];
}

/** The full authentication result returned by authenticate(). */
export interface AuthResult {
  provider: "github";
  method: "apple";
  accessToken: string;
  user: GithubUser;
  emails: GithubEmail[];
}
