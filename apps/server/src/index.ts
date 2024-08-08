import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { config } from "dotenv";
import {
  createDAVClient,
  DAVCalendar,
  DAVClient,
  updateCalendarObject,
} from "tsdav";
import ical from "ical-generator";
import dayjs from "dayjs";
import { cors } from "hono/cors";

interface LogeseqTodo {
  text: string;
  scheduledTime: string;
  uid: string;
}

config();
const app = new Hono();
app.use("*", cors());

console.log("process.env", process.env.VITE_APPLE_USER_NAME);

const client = new DAVClient({
  serverUrl: "https://caldav.icloud.com",
  credentials: {
    username: process.env.VITE_APPLE_USER_NAME,
    password: process.env.VITE_APPLE_USER_PASSWORD,
  },
  authMethod: "Basic",
  defaultAccountType: "caldav",
});

const login = client.login();

async function connectDav(logeseqTodos: LogeseqTodo[]) {
  const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
  console.log("connectDav", {
    username: process.env.VITE_APPLE_USER_NAME,
    password: process.env.VITE_APPLE_USER_PASSWORD,
  });

  try {
    await login;
  } catch (error) {
    console.error("Error logging", error);
  }

  const calendars = await client.fetchCalendars();
  const targetCalendar = calendars.find((c) => c.displayName === "工作");

  console.log("targetCalendar", targetCalendar);

  if (!targetCalendar) {
    return;
  }
  for (const todo of logeseqTodos) {
    const events = [
      {
        start: dayjs(todo.scheduledTime, "YYYY-MM-DD ddd HH:mm").toDate(),
        end: dayjs(todo.scheduledTime, "YYYY-MM-DD ddd HH:mm")
          .add(1, "hour")
          .toDate(),
        summary: todo.text,
        description: todo.text,
        uid: todo.uid,
      },
    ];

    const eventICal = ical({ events });
    const eventICalData = eventICal.toString();
    const filename = `task-${todo.uid}.ics`; // 使用UID作为文件名的一部分

    const eventResponse = await client.fetchCalendarObjects({
      calendar: targetCalendar,
      filters: [
        {
          type: "comp-filter",
          attributes: { name: "VCALENDAR" },
          children: [
            {
              type: "comp-filter",
              attributes: { name: "VEVENT" },
              children: [
                {
                  type: "prop-filter",
                  attributes: { name: "UID" },
                  children: [
                    {
                      type: "text-match",
                      value: todo.uid,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    if (eventResponse.length > 0) {
      console.log(`Updating event: ${filename}`);
      await updateEvent(
        eventResponse[0].url,
        targetCalendar,
        eventICalData,
        eventResponse[0].etag
      );
    } else {
      console.log(`Creating event: ${filename}`);
      await createEvent(filename, targetCalendar, eventICalData);
    }
  }
}

const updateEvent = async (
  url: string,
  targetCalendar: DAVCalendar,
  eventICalData: string,
  etag?: string
) => {
  if (!targetCalendar) {
    return;
  }

  try {
    const updateResponse = await updateCalendarObject({
      calendarObject: {
        url: url,
        data: eventICalData,
        etag: etag,
      },
    });

    if (updateResponse.ok) {
      console.log("Event successfully updated.");
    } else {
      console.error(
        "Error updating event:",
        updateResponse.status,
        updateResponse.statusText
      );
    }
  } catch (error) {
    console.error("Error updating event:", error);
  }
};

const createEvent = async (
  filename: string,
  targetCalendar: DAVCalendar,
  eventICalData: string
) => {
  if (!targetCalendar) {
    return;
  }

  await login;

  const createResponse = await client.createCalendarObject({
    calendar: targetCalendar,
    filename: filename,
    iCalString: eventICalData,
  });

  if (createResponse.ok) {
    console.log("Event successfully created.");
  } else {
    console.error(
      "Error creating event:",
      createResponse.status,
      createResponse.statusText
    );
  }
};

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.post("/calc", async (c) => {
  const logeseqTodos = await c.req.json<{
    tasks: LogeseqTodo[];
  }>();
  try {
    connectDav(logeseqTodos.tasks);
  } catch (error) {
    console.error("Error connecting to CalDAV:", error);
  }
  return c.text("Hello Hono!");
});

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
