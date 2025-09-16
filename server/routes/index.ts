import users from "./users";

export async function registerRoutes(app: import("express").Express) {
  app.use(users);
}