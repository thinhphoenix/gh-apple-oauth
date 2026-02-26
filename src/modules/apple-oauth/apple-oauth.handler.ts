import type {
  GithubAccessTokenResponse,
  GithubEmail,
  GithubUser,
} from "./types/github-oauth.type";

const githubTokenEndpoint = "https://github.com/login/oauth/access_token";
const githubUserEndpoint = "https://api.github.com/user";
const githubUserEmailsEndpoint = "https://api.github.com/user/emails";

const requiredEnv = (
  key: "GITHUB_CLIENT_ID" | "GITHUB_CLIENT_SECRET" | "GITHUB_REDIRECT_URI"
): string => {
  const envValue = process.env[key];

  if (!envValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return envValue;
};

export const createOauthState = (): string =>
  crypto.randomUUID().replaceAll("-", "");

export const buildGithubAuthorizePath = (state: string): string => {
  const githubClientId = requiredEnv("GITHUB_CLIENT_ID");
  const githubRedirectUri = requiredEnv("GITHUB_REDIRECT_URI");

  return (
    "/login/oauth/authorize?" +
    new URLSearchParams({
      client_id: githubClientId,
      redirect_uri: githubRedirectUri,
      scope: "read:user user:email",
      state,
      allow_signup: "false",
    }).toString()
  );
};

export const buildGithubAppleInitiateUrl = (authorizePath: string): string =>
  "https://github.com/sessions/social/apple/initiate?" +
  new URLSearchParams({
    disable_signup: "true",
    return_to: authorizePath,
  }).toString();

export const exchangeGithubCodeForToken = async (
  code: string
): Promise<string> => {
  const githubClientId = requiredEnv("GITHUB_CLIENT_ID");
  const githubClientSecret = requiredEnv("GITHUB_CLIENT_SECRET");
  const githubRedirectUri = requiredEnv("GITHUB_REDIRECT_URI");

  const tokenResponse = await fetch(githubTokenEndpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: githubClientId,
      client_secret: githubClientSecret,
      code,
      redirect_uri: githubRedirectUri,
    }),
  });

  const tokenPayload =
    (await tokenResponse.json()) as GithubAccessTokenResponse;

  if (!tokenResponse.ok || !tokenPayload.access_token) {
    const errorMessage =
      tokenPayload.error_description ??
      tokenPayload.error ??
      "Unable to exchange code for access token";

    throw new Error(errorMessage);
  }

  return tokenPayload.access_token;
};

export const fetchGithubProfile = async (
  accessToken: string
): Promise<{ user: GithubUser; emails: GithubEmail[] }> => {
  const requestHeaders = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
  };

  const [userResponse, emailsResponse] = await Promise.all([
    fetch(githubUserEndpoint, { headers: requestHeaders }),
    fetch(githubUserEmailsEndpoint, { headers: requestHeaders }),
  ]);

  if (!userResponse.ok || !emailsResponse.ok) {
    throw new Error("Unable to fetch GitHub profile");
  }

  const user = (await userResponse.json()) as GithubUser;
  const emails = (await emailsResponse.json()) as GithubEmail[];

  return {
    user,
    emails,
  };
};
