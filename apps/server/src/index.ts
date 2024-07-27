import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { config } from "dotenv";
import { createDAVClient, DAVClient } from "tsdav";


config();
const app = new Hono();

console.log("process.env", process.env.VITE_APPLE_USER_NAME);


async function connectDav() {
  console.log("connectDav", {
    username: process.env.VITE_APPLE_USER_NAME,
    password: process.env.VITE_APPLE_USER_PASSWORD,
  });
  const client = new DAVClient({
    serverUrl: "https://caldav.icloud.com",
    credentials: {
      username: process.env.VITE_APPLE_USER_NAME,
      password: process.env.VITE_APPLE_USER_PASSWORD,
    },
    authMethod: "Basic",
    defaultAccountType: "caldav",
  });

  await client.login();

  const calendars = await client.fetchCalendars();
  console.log("calendars", calendars);
}

app.get("/", (c) => {
  connectDav();
  return c.text("Hello Hono!");
});

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
