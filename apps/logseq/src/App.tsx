import dayjs from "dayjs";
import "./App.css";
import { useState } from "react";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { ofetch } from "ofetch";

dayjs.extend(customParseFormat);

const getTodayTodo = async () => {
  const today = dayjs().format("YYYYMMDD");
  // TODO: shceduledTime 标签不正确
  const todo = await logseq.DB.datascriptQuery(`
 [:find (pull ?b [*])
       :where
       (or
         [?b :block/marker "TODO"]
         [?b :block/marker "SCHEDULED"])
       [?b :block/page ?p]
       [?p :block/journal? true]
       [?p :block/journal-day ${today}]]
  `);
  return todo;
};

const mapTodo = async (todo) => {
  const block = todo[0]; // 获取第一个块对象
  const content = block.content; // 获取块的内容
  const text = content
    .replace(/^TODO\s*/, "")
    .replace(/SCHEDULED:.*$/, "")
    .trim();

  const scheduledMatch = content.match(/SCHEDULED:\s*<([^>]+)>/);
  let scheduledTimeText;
  let isAllDay = false;
  let scheduledTime;

  if (scheduledMatch) {
    const dateString = scheduledMatch[1];

    if (dateString.length === 14) {
      // 如果日期格式为 YYYYMMDD
      scheduledTimeText = dayjs(dateString, "YYYY-MM-DD").format(
        "YYYY-MM-DDTHH:mm:ss"
      );
      scheduledTime = dayjs(dateString, "YYYY-MM-DD").valueOf();
      isAllDay = true; // 没有时间信息，则为全天事件
    } else if (dateString.length > 14) {
      // 如果日期格式包含时间
      scheduledTimeText = dayjs(dateString, "YYYY-MM-DD HH:mm").format(
        "YYYY-MM-DDTHH:mm:ss"
      );
      scheduledTime = dayjs(dateString, "YYYY-MM-DD HH:mm").valueOf();
      isAllDay = scheduledTimeText.endsWith("00:00:00"); // 如果时间部分为00:00:00，则为全天事件
    }
  } else {
    scheduledTimeText = dayjs().format("YYYY-MM-DDTHH:mm:ss");
    scheduledTime = dayjs().valueOf();
  }

  return {
    text,
    scheduledTimeText,
    uid: block.uuid,
    isAllDay,
    scheduledTime,
  };
};

const App = () => {
  console.log(import.meta.env.VITE_APPLE_USER_NAME);
  const [todo, setTodo] = useState<
    {
      text: string;
      scheduledTime: string;
      isAllDay: boolean;
      scheduledTimeText: string;
    }[]
  >([]);

  const handleGetTodo = async () => {
    const todo = await getTodayTodo();
    const tasks = todo.map(mapTodo);
    const resolvedTasks = await Promise.all(tasks);
    setTodo(resolvedTasks);
  };

  const handleSyncTodo = async () => {
    const todo = await getTodayTodo();

    const tasks = todo.map(mapTodo);

    const resolvedTasks = await Promise.all(tasks);
    setTodo(resolvedTasks);

    console.log(resolvedTasks);

    try {
      await ofetch("http://localhost:3000/calc", {
        method: "POST",
        body: { tasks: resolvedTasks },
      });
      console.log("Tasks successfully sent to backend for synchronization.");
    } catch (error) {
      console.error("Error sending tasks to backend:", error);
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <div
        className="w-screen h-screen fixed top-0 left-0"
        onClick={() => logseq.hideMainUI()}
      ></div>
      <div className="absolute p-4 w-90 h-120 -left-13rem bg-white shadow rounded-lg overflow-y-auto scrollbar-hide border-2 transition-all transition-200">
        <h1 className="font-bold text-4xl">Calendar Sync</h1>
        {/* <h2 className="text-2xl mt-6">
          Current Env: {import.meta.env.VITE_MODE}
        </h2> */}

        <h2 className="text-2xl mt-6">Todos:</h2>
        <ul>
          {todo.map((todo, index) => (
            <li key={index}>
              <div>text: {todo.text}</div>
              <div>isAllDay: {todo.isAllDay ? "All Day" : ""}</div>
              <div>scheduledTime: {todo.scheduledTime}</div>
              <div>scheduledTimeText: {todo.scheduledTimeText}</div>
            </li>
          ))}
        </ul>

        <button
          className="mt-6 bg-white text-black px-4 py-2 rounded"
          onClick={handleGetTodo}
        >
          Get Todo
        </button>
        <button
          className="mt-6 bg-white text-black px-4 py-2 rounded"
          onClick={handleSyncTodo}
        >
          Sync
        </button>
      </div>
    </div>
  );
};

export default App;
