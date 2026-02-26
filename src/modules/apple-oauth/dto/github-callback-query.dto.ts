import { t } from "elysia";

export const githubCallbackQueryDto = t.Object({
  code: t.Optional(t.String()),
  state: t.Optional(t.String()),
  error: t.Optional(t.String()),
  error_description: t.Optional(t.String()),
  error_uri: t.Optional(t.String()),
});
