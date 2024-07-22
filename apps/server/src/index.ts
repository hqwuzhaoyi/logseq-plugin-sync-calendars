import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { config } from "dotenv";
config();
const app = new Hono();

console.log("process.env", process.env.VITE_APPLE_USER_NAME);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
