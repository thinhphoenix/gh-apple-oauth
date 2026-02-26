import { Elysia } from "elysia";
import { appleOauthRoute } from "./apple-oauth/apple-oauth.route";

export const modulesRoute = new Elysia().use(appleOauthRoute);
