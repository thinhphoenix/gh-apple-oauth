import { GhAppleOAuth } from "gh-apple-oauth";


const requiredEnv = (
  key: "GITHUB_CLIENT_ID" | "GITHUB_CLIENT_SECRET" | "GITHUB_REDIRECT_URI"
): string => {
  const envValue = process.env[key];

  if (!envValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return envValue;
};

export const createOAuthClient = () =>
  new GhAppleOAuth({
    clientId: requiredEnv("GITHUB_CLIENT_ID"),
    clientSecret: requiredEnv("GITHUB_CLIENT_SECRET"),
    redirectUri: requiredEnv("GITHUB_REDIRECT_URI"),
  });
