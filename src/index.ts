import { Elysia } from "elysia";
import { modulesRoute } from "./modules/modules.route";

const app = new Elysia()
  .get("/", () => "Apple OAuth service is running")
  .use(modulesRoute)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
