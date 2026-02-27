// gh-apple-oauth - Apple OAuth via GitHub, zero dependencies.

// Class
export { GhAppleOAuth } from "./client";

// Standalone functions
export { createState, createAuthUrl, exchangeCode, getProfile } from "./client";

// Error
export { GhAppleOAuthError } from "./errors";

// Types
export type {
  GhAppleOAuthConfig,
  AuthUrlResult,
  GithubUser,
  GithubEmail,
  GithubProfile,
  AuthResult,
} from "./types";
