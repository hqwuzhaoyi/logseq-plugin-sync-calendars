import dayjs from "dayjs";
import "./App.css";
import { useState } from "react";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { ofetch } from "ofetch";
import { settingsState } from "./state/settings";
import { useRecoilValue } from "recoil";
import { Button } from "@/components/ui/button";
import { Label } from "./components/ui/label";

type LogseqTodo = {
  properties: Record<string, any>;
  scheduled?: number; // Optional, as not all items have a scheduled date
  parent: {
    id: number;
  };
  id: number;
  uuid: string;
  "path-refs": {
    id: number;
  }[];
  content: string;
  "journal?": boolean;
  marker: string; // Assuming this is always "TODO"
  page: {
    id: number;
  };
  left: {
    id: number;
  };
  format: string; // Assuming this is always "markdown"
  refs: {
    id: number;
  }[];
  type: string; // Assuming this is always "TODO"
  date: string; // Date in string format, e.g., "No Date" or "2024-08-28"
  "journal-day"?: number; // Optional, as it is not in all items
};

type TodoItemType = {
  id: number;
  uuid: string;
  uid: string;
  text: string;
  content: string;
  isAllDay: boolean;
  date: string;
  scheduledTimeText: string;
  scheduledTime: number;
  calendarUid: string | null;
  type: "TODO" | "SCHEDULED";
};

// TODO: 同步TODO到日历，增加删除和选择同步功能
// TODO: 勾选需要同步的TODO
// 支持更多标签 TODO SCHEDULED DEADLINE LATER NOW
// TODO: 同步时间不由文字记录，由插件选择日期

dayjs.extend(customParseFormat);

const findParentDate = async (parentId) => {
  if (!parentId) return null;

  const parentBlock = await logseq.Editor.getBlock(parentId, {
    includeChildren: true,
  });
  while (parentBlock) {
    const parentContent = parentBlock.content;
    const journalDayMatch = parentContent.match(/\d{8}/); // 匹配 8 位日期，例如 20240813
    if (journalDayMatch) {
      const journalDay = journalDayMatch[0];
      return {
        scheduledTimeText: dayjs(journalDay, "YYYYMMDD").format(
          "YYYY-MM-DDTHH:mm:ss"
        ),
        scheduledTime: dayjs(journalDay, "YYYYMMDD").valueOf(),
        isAllDay: true,
      };
    }
    if (!parentBlock.parent?.id) break; // 如果没有父块，退出循环
    const page = await logseq.Editor.getPage(parentBlock.parent.id, {
      includeChildren: true,
    }); // 获取上一级父块

    if (page) {
      return {
        scheduledTimeText: dayjs(page.journalDay + "", "YYYYMMDD").format(
          "YYYY-MM-DDTHH:mm:ss"
        ),
        scheduledTime: dayjs(page.journalDay + "", "YYYYMMDD").valueOf(),
        isAllDay: true,
      };
    }
  }

  if (!parentBlock) {
    const page = await logseq.Editor.getPage(parentId, {
      includeChildren: true,
    }); // 获取上一级父块

    if (page) {
      return {
        scheduledTimeText: dayjs(page.journalDay + "", "YYYYMMDD").format(
          "YYYY-MM-DDTHH:mm:ss"
        ),
        scheduledTime: dayjs(page.journalDay + "", "YYYYMMDD").valueOf(),
        isAllDay: true,
      };
    }
  }

  return null;
};

const curryHandleLogseqMapItem =
  (defaultDay?: string) =>
  async ([block]) => {
    const marker = block.marker;
    const scheduledMatch = block.content.match(/SCHEDULED:\s*<([^>]+)>/);
    const content = block.content; // 获取块的内容
    const text = content
      .replace(/^TODO\s*/, "")
      .replace(/SCHEDULED:.*$/, "")
      .trim();
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
        scheduledTime = dayjs(dateString, "YYYYMMDD").valueOf();
        isAllDay = true; // 没有时间信息，则为全天事件
      } else if (dateString.length > 14) {
        // 如果日期格式包含时间
        scheduledTimeText = dayjs(dateString, "YYYY-MM-DD HH:mm").format(
          "YYYY-MM-DDTHH:mm:ss"
        );
        scheduledTime = dayjs(dateString, "YYYY-MM-DD HH:mm").valueOf();
        isAllDay = scheduledTimeText.endsWith("00:00:00"); // 如果时间部分为00:00:00，则为全天事件
      }
    } else if (defaultDay) {
      scheduledTimeText = dayjs(defaultDay).format("YYYY-MM-DDTHH:mm:ss");
      scheduledTime = dayjs(defaultDay).valueOf();
      isAllDay = true;
    } else {
      // TODO: 从logseq向上查找日期
      const parentDate = await findParentDate(block.parent?.id);
      if (parentDate) {
        scheduledTimeText = parentDate.scheduledTimeText;
        scheduledTime = parentDate.scheduledTime;
        isAllDay = parentDate.isAllDay;
      } else if (block["journal-day"]) {
        // 如果块直接有 journal-day 属性，使用它
        const journalDay = block["journal-day"];
        scheduledTimeText = dayjs(journalDay, "YYYYMMDD").format(
          "YYYY-MM-DDTHH:mm:ss"
        );
        scheduledTime = dayjs(journalDay, "YYYYMMDD").valueOf();
        isAllDay = true;
      } else {
        scheduledTimeText = "No Date";
        scheduledTime = 0;
        isAllDay = false;
      }
    }

    /**
     * 获取日历的 uid
     */
    const calendarUid = block.properties?.calendarUid || null;

    return {
      ...block,
      calendarUid,
      type: marker === "TODO" ? "TODO" : "SCHEDULED",
      isAllDay,
      scheduledTime,
      scheduledTimeText,
      text,
    };
  };

const handleLogseqToList:
  | ((todoBlocks: [LogseqTodo][]) => Promise<TodoItemType[]>)
  | undefined = async (todoBlocks) => {
  const handleLogseqMapItem = curryHandleLogseqMapItem();
  const result = await Promise.all(todoBlocks.map(handleLogseqMapItem));
  return result;
};

const getAllTodoList = async (): Promise<TodoItemType[]> => {
  const todoBlocks = await logseq.DB.datascriptQuery<[LogseqTodo][]>(`
    [:find (pull ?b [*])
      :where
      (or
        [?b :block/marker "TODO"]
        [?b :block/marker "SCHEDULED"])
      [?b :block/page ?p]
      [?p :block/journal? true]]
  `);

  const result = await handleLogseqToList(todoBlocks);

  return result;
};

const categorizeAndSortTodos = async () => {
  const allTodos = await getAllTodoList();

  // Initialize a date-based dictionary to store categorized todos
  const categorizedTodos = allTodos.reduce((acc, todo) => {
    const scheduledMatch = todo.content.match(/SCHEDULED:\s*<([^>]+)>/);
    const dateStr = scheduledMatch
      ? dayjs(scheduledMatch[1], "YYYYMMDD").format("YYYY-MM-DD")
      : "No Date";

    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }

    acc[dateStr].push(todo);

    return acc;
  }, {});

  // Sort each category by scheduled time
  Object.keys(categorizedTodos).forEach((date) => {
    categorizedTodos[date] = categorizedTodos[date].sort((a, b) => {
      const aScheduled = a.scheduled || 0;
      const bScheduled = b.scheduled || 0;
      return aScheduled - bScheduled;
    });
  });

  return categorizedTodos;
};

const displayCategorizedTodos = async () => {
  const sortedTodos = await categorizeAndSortTodos();
  console.log(sortedTodos);
};

const getTodayTodo = async () => {
  const today = dayjs().format("YYYYMMDD");

  const todo = await logseq.DB.datascriptQuery<[LogseqTodo][]>(`
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

const TodoList = ({ todos }: { todos: TodoItemType[] }) => {
  return todos.map((todo) => (
    <a
      href="#"
      key={todo.id}
      className="flex flex-col items-start gap-2 whitespace-nowrap border-b p-4 text-sm leading-tight last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
      <div className="flex w-full items-center gap-2">
        <span className="flex items-center gap-2">
          <Label>Text</Label>
          {todo.content}
        </span>{" "}
        <span className="ml-auto text-xs">{todo.date}</span>
      </div>
      <span className="font-medium">{todo.isAllDay ? "All Day" : ""}</span>
      <span className="font-medium">{todo.scheduledTimeText}</span>
      <span className="font-medium">{todo.scheduledTime}</span>
      {/* <span className="line-clamp-2 w-[260px] whitespace-break-spaces text-xs">
        {todo.scheduledTimeText}
      </span> */}
    </a>
  ));
};

const App = () => {
  const [todoList, setTodoList] = useState<TodoItemType[]>([]);
  const settings = useRecoilValue(settingsState);

  console.log("settings", settings);

  const handleGetTodayTodo = async () => {
    const todo = await getTodayTodo();
    const handleLogseqMapItem = curryHandleLogseqMapItem(dayjs().format());
    const tasks = todo.map(handleLogseqMapItem);
    const resolvedTasks = await Promise.all(tasks);
    setTodoList(resolvedTasks);
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
    const handleLogseqMapItem = curryHandleLogseqMapItem(dayjs().format());
    const tasks = todo.map(handleLogseqMapItem);

    const resolvedTasks = await Promise.all(tasks);
    setTodoList(resolvedTasks);

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
        const syncResult = syncResults.find((res) => res.id === task.id);
        if (syncResult && syncResult.calendarUid) {
          // 如果服务端返回了 `calendarUid`，说明任务已同步，更新任务块的 `calendarUid`
          await addCalendarUid(task.id, syncResult.calendarUid);
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
        <div className="grid gap-4">
          <Button
            className="inline-flex items-center justify-center w-full  gap-4"
            onClick={async () => {
              const todoList = await getAllTodoList();

              setTodoList(todoList);
            }}
          >
            Get All Todo
          </Button>
          <Button
            className="inline-flex items-center justify-center w-full  gap-4"
            onClick={handleGetTodayTodo}
          >
            Get Today Todo
          </Button>
          <Button
            className="inline-flex items-center justify-center w-full  gap-4"
            onClick={displayCategorizedTodos}
          >
            Categorized Todos
          </Button>

          <Button
            className="inline-flex items-center justify-center w-full  gap-4"
            onClick={handleSyncTodo}
          >
            Sync
          </Button>

          <div className="grid gap-4 overflow-y-auto scrollbar-hide max-h-[240px]">
            <TodoList todos={todoList} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
