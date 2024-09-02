import { LogeseqTodo, syncCalendar } from "sync-calendar";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("body", body);
    const logseqTodos: LogeseqTodo[] = body.todos;
    await syncCalendar(logseqTodos);
    return new Response("Successfully created events in calendar.", {
      status: 200,
    });
  } catch (error) {
    console.error("Error processing POST request:", error);
    return new Response("Error processing POST request", {
      status: 500,
    });
  }
}
