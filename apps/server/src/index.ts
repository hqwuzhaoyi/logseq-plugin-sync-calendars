import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { config } from "dotenv";
import { DAVCalendar, DAVCalendarObject, DAVClient } from "tsdav";
import ical from "ical-generator";
import dayjs from "dayjs";
import { cors } from "hono/cors";

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

  if (!isLogin) {
    try {
      await login;
      isLogin = true;
    } catch (error) {
      console.error("Error logging", error);
    }
  }

  if (!calendar) {
    try {
      const calendars = await client.fetchCalendars();
      calendar = calendars.find((c) => c.displayName === "logseq");

      console.log("calendar", calendar);
    } catch (error) {
      console.error("Error fetching calendars", error);
    }

    if (!calendar) {
      console.error("No calendar found with the name 'logseq'");
      return;
    }
  }

  for (const todo of logeseqTodos) {
    let startTime, endTime;
    if (!todo.isAllDay) {
      // 如果有时间信息，设置具体的时间段
      startTime = dayjs(todo.scheduledTime).toDate();
      endTime = dayjs(todo.scheduledTime).add(1, "hour").toDate(); // 默认1小时的事件
    } else {
      // 如果没有时间信息，设置为全天事件
      startTime = dayjs(todo.scheduledTime).startOf("day").toDate();
      endTime = dayjs(todo.scheduledTime).endOf("day").toDate();
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
    const filename = `task-${todo.uid}.ics`; // 使用UID作为文件名的一部分

    const eventUrl = `${calendar.url}${filename}`;

    const eventResponse = await client.fetchCalendarObjects({
      objectUrls: [eventUrl],
      calendar: calendar,
    });

    if (eventResponse.length > 0) {
      const object = eventResponse[0];
      console.log(`Updating event: ${filename}`);
      await updateEvent({
        ...object,
        data: eventICalData,
      });
    } else {
      console.log(`Creating event: ${filename}`);
      await createEvent(filename, calendar, eventICalData);
    }
  }
}

const updateEvent = async (calendarObject: DAVCalendarObject) => {
  if (!calendar) {
    return;
  }

  try {
    const updateResponse = await client.updateCalendarObject({
      calendarObject,
    });

    if (updateResponse.ok) {
      console.log("Event successfully updated.");
    } else {
      throw new Error(updateResponse.status + updateResponse.statusText);
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
  if (!calendar) {
    return;
  }
  try {
    const createResponse = await client.createCalendarObject({
      calendar: calendar,
      filename: filename,
      iCalString: eventICalData,
    });

    if (createResponse.ok) {
      console.log("Event successfully created.");
    } else {
      throw new Error(createResponse.status + createResponse.statusText);
    }
  } catch (error) {
    console.error("Error creating event:", error);
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
