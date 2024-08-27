import { DAVCalendar, DAVCalendarObject, DAVClient } from "tsdav";

let isLogin = false;

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
      return true;
    } catch (error) {
      console.error("Error logging into CalDAV server:", error);
      throw error; // Throw the error so it can be handled where login is called
    }
  }
  return true;
}

export async function GET(request: Request) {
  console.log("process.env", process.env.APPLE_USER_NAME);
  await loginDavClient();
  return new Response("Logged in to CalDAV server successfully.", {
    status: 200,
  });
}
