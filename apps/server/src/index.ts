import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { config } from "dotenv";
import { DAVCalendar, DAVCalendarObject, DAVClient } from "tsdav";
import ical from "ical-generator";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";
import { cors } from "hono/cors";

dayjs.extend(customParseFormat);
dayjs.extend(utc);

interface LogeseqTodo {
  text: string;
  scheduledTime: string;
  uid: string;
  isAllDay: boolean;
}

let isLogin = false;
let calendar: DAVCalendar | undefined;

config();
const app = new Hono();
app.use("*", cors());

console.log("process.env", process.env.APPLE_USER_NAME);

const client = new DAVClient({
  serverUrl: "https://caldav.icloud.com",
  credentials: {
    username: process.env.APPLE_USER_NAME,
    password: process.env.APPLE_USER_PASSWORD,
  },
  authMethod: "Basic",
  defaultAccountType: "caldav",
});

async function loginDavClient() {
  if (!isLogin) {
    try {
      await client.login();
      isLogin = true;
      console.log("Logged in to CalDAV server successfully.");
    } catch (error) {
      console.error("Error logging into CalDAV server:", error);
      throw error; // Throw the error so it can be handled where login is called
    }
  }
}

async function fetchCalendar() {
  if (!calendar) {
    try {
      const calendars = await client.fetchCalendars();
      calendar = calendars.find((c) => c.displayName === "logseq");

      if (!calendar) {
        throw new Error("No calendar found with the name 'logseq'");
      }

      console.log("Fetched calendar successfully");
    } catch (error) {
      console.error("Error fetching calendars:", error);
      throw error; // Throw the error so it can be handled where the function is called
    }
  }
}

async function connectDav(logeseqTodos: LogeseqTodo[]) {
  try {
    await loginDavClient();
    await fetchCalendar();
    if (!calendar) {
      throw new Error("No calendar found");
    }

    for (const todo of logeseqTodos) {
      let startTime, endTime;
      if (!todo.isAllDay) {
        startTime = dayjs.utc(todo.scheduledTime).toDate();
        endTime = dayjs.utc(todo.scheduledTime).add(1, "hour").toDate(); // 默认1小时的事件
      } else {
        startTime = dayjs.utc(todo.scheduledTime + "", "YYYYMMDD").toDate();
        endTime = dayjs
          .utc(todo.scheduledTime + "", "YYYYMMDD")
          .add(1, "day")
          .toDate();
      }

      const events = [
        {
          start: startTime,
          end: endTime,
          summary: todo.text,
          description: todo.text,
          uid: todo.uid,
          allDay: todo.isAllDay,
        },
      ];

      const eventICal = ical({ events });
      const eventICalData = eventICal.toString();
      const filename = `task-${todo.uid}.ics`;

      try {
        const eventResponse = await client.fetchCalendarObjects({
          calendar: calendar,
          objectUrls: [filename],
        });

        console.log(`eventResponse for UID ${todo.uid}:`, eventResponse);

        if (eventResponse.length > 0) {
          const object = eventResponse[0];
          console.log(`Updating event with UID: ${todo.uid}`);
          await updateEvent({
            ...object,
            data: eventICalData,
          });
        } else {
          console.log(`Creating event with UID: ${todo.uid}`);
          await createEvent(filename, calendar, eventICalData);
        }
      } catch (error) {
        console.error(`Error processing event for ${filename}:`, error);
      }
    }
  } catch (error) {
    console.error("Error in connectDav function:", error);
  }
}

const updateEvent = async (calendarObject: DAVCalendarObject) => {
  try {
    if (calendarObject.etag === "undefined") {
      delete calendarObject.etag;
    }
    const updateResponse = await client.updateCalendarObject({
      calendarObject,
    });

    if (updateResponse.ok) {
      console.log("Event successfully updated.");
    } else {
      throw new Error(
        `Failed to update event: ${updateResponse.status} ${updateResponse.statusText}`
      );
    }
  } catch (error) {
    console.error("Error updating event:", error);
  }
};

const createEvent = async (
  filename: string,
  calendar: DAVCalendar,
  eventICalData: string
) => {
  try {
    const createResponse = await client.createCalendarObject({
      calendar: calendar,
      filename: filename,
      iCalString: eventICalData,
    });

    if (createResponse.ok) {
      console.log("Event successfully created.");
    } else {
      throw new Error(
        `Failed to create event: ${createResponse.status} ${createResponse.statusText}`
      );
    }
  } catch (error) {
    console.error("Error creating event:", error);
  }
};

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.post("/calendar", async (c) => {
  const logeseqTodos = await c.req.json<{
    tasks: LogeseqTodo[];
  }>();
  try {
    await connectDav(logeseqTodos.tasks);
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
