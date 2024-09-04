import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { config } from "dotenv";
import { cors } from "hono/cors";
import { syncCalendar, LogeseqTodo } from "sync-calendar";

config();

const app = new Hono();

app.use("*", cors());

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.post("/calendar", async (c) => {
  const logeseqTodos = await c.req.json<{
    tasks: LogeseqTodo[];
  }>();
  console.log("logeseqTodos", logeseqTodos);
  try {
    await syncCalendar(logeseqTodos.tasks);
  } catch (error) {
    console.error("Error connecting to CalDAV:", error);
    return c.json({ error: "Failed to sync tasks" }, 500);
  }
  return c.json({ message: "Tasks successfully synced" });
});

const port = 3010;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
