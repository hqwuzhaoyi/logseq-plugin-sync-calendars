import dayjs from "dayjs";
import "./App.css";
import { useState } from "react";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { ofetch } from "ofetch";
import { settingsState } from "./state/settings";
import { useRecoilValue } from "recoil";
// TODO: 同步TODO到日历，增加删除和选择同步功能

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
      scheduledTime = block.scheduled;
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

  /**
   * 获取日历的 uid
   */
  const calendarUid = block.properties?.calendarUid || null;

  return {
    text,
    scheduledTimeText,
    uid: block.uuid,
    isAllDay,
    scheduledTime,
    calendarUid,
  };
};

const App = () => {
  const [todo, setTodo] = useState<
    {
      text: string;
      scheduledTime: string;
      isAllDay: boolean;
      scheduledTimeText: string;
    }[]
  >([]);
  const settings = useRecoilValue(settingsState);

  console.log("settings", settings);

  const handleGetTodo = async () => {
    const todo = await getTodayTodo();
    const tasks = todo.map(mapTodo);
    const resolvedTasks = await Promise.all(tasks);
    setTodo(resolvedTasks);
  };

  // Function to add/update the calendar UID in the task block after sync
  const addCalendarUid = async (blockId, newCalendarUid) => {
    await logseq.Editor.upsertBlockProperty(
      blockId,
      "calendarUid",
      newCalendarUid
    );
  };

  const handleSyncTodo = async () => {
    const todo = await getTodayTodo();

    const tasks = todo.map(mapTodo);

    const resolvedTasks = await Promise.all(tasks);
    setTodo(resolvedTasks);

    console.log(resolvedTasks);

    const serverUrl =
      import.meta.env.VITE_MODE === "web"
        ? "http://localhost:3010/calendar"
        : settings.serverUrl;

    if (!serverUrl) {
      console.error("Server URL is not set.");
      return;
    }

    try {
      const syncResults = await ofetch(serverUrl, {
        method: "POST",
        body: { tasks: resolvedTasks },
      });

      for (const task of resolvedTasks) {
        const syncResult = syncResults.find((res) => res.id === task.blockId);
        if (syncResult && syncResult.calendarUid) {
          // 如果服务端返回了 `calendarUid`，说明任务已同步，更新任务块的 `calendarUid`
          await addCalendarUid(task.blockId, syncResult.calendarUid);
        }
      }

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
