import { Elysia } from "elysia";
import { usersRoute } from "./routes/users-route";

const port = process.env.PORT || 3000;

const app = new Elysia()
  .get("/", () => ({
    message: "🚀 Bun + Elysia + Drizzle + MySQL Starter API is running!",
    status: "online",
    timestamp: new Date().toISOString(),
  }))
  .get("/health", () => ({
    status: "ok",
    uptime: process.uptime(),
  }))
  .use(usersRoute)
  .listen(port);

console.log(`🦊 Server is running at http://${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
