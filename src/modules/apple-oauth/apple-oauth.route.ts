import { Elysia } from "elysia";
import { createOAuthClient } from "./apple-oauth.handler";
import { githubCallbackQueryDto } from "./dto/github-callback-query.dto";

const oauthStateMaxAgeSeconds = 60 * 10;

export const appleOauthRoute = new Elysia({ prefix: "/auth" })
  .get("/apple", ({ cookie, redirect, status }) => {
    try {
      const auth = createOAuthClient();
      const { url, state } = auth.createAuthUrl();

      cookie.ghOAuthState.value = state;
      cookie.ghOAuthState.httpOnly = true;
      cookie.ghOAuthState.sameSite = "lax";
      cookie.ghOAuthState.secure = process.env.NODE_ENV === "production";
      cookie.ghOAuthState.path = "/";
      cookie.ghOAuthState.maxAge = oauthStateMaxAgeSeconds;

      return redirect(url, 302);
    } catch (error) {
      return status(500, {
        error: "server_misconfigured",
        errorDescription:
          error instanceof Error ? error.message : "Configuration error",
      });
    }
  })
  .get(
    "/apple/callback",
    async ({ query, cookie, status }) => {
      if (query.error) {
        return status(400, {
          error: query.error,
          errorDescription: query.error_description ?? "OAuth denied",
        });
      }

      if (!query.code || !query.state) {
        return status(400, {
          error: "invalid_oauth_callback",
          errorDescription: "Missing code or state",
        });
      }

      const savedState =
        typeof cookie.ghOAuthState.value === "string"
          ? cookie.ghOAuthState.value
          : "";

      if (!savedState || savedState !== query.state) {
        return status(400, {
          error: "invalid_oauth_state",
          errorDescription: "State does not match",
        });
      }

      cookie.ghOAuthState.remove();

      try {
        const auth = createOAuthClient();
        const result = await auth.authenticate(query.code);

        return {
          provider: result.provider,
          method: result.method,
          user: result.user,
          emails: result.emails,
        };
      } catch (error) {
        return status(400, {
          error: "oauth_exchange_failed",
          errorDescription:
            error instanceof Error
              ? error.message
              : "Unable to complete OAuth flow",
        });
      }
    },
    {
      query: githubCallbackQueryDto,
    }
  );
