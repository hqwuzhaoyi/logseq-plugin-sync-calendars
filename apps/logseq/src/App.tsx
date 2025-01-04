import dayjs from "dayjs";
import "./App.css";
import { useState } from "react";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { settingsState } from "./state/settings";
import { useRecoilValue } from "recoil";
import { Button } from "@/components/ui/button";
import { TodoTable } from "./components/TodoTable";
import { ErrorAlert, ErrorAlertProps } from "./components/ErrorAlert";
import { handleError } from "@/lib/errorHandler";
import { TodoList } from "./components/TodoList";
import type { TodoItemType } from "./types";
import { curryHandleLogseqMapItem } from "./lib/logseq/curryHandleLogseqMapItem";
import { categorizeAndSortTodos } from "./lib/logseq/categorizeAndSortTodos";
import { getTodayTodo } from "./lib/logseq/getTodayTodo";
import { getAllTodoList } from "./lib/logseq/getAllTodoList";
import { handleSyncTodo } from "./lib/logseq/syncTodo";

// TODO: 同步TODO到日历，增加删除和选择同步功能
// TODO: 勾选需要同步的TODO
// 支持更多标签 TODO SCHEDULED DEADLINE LATER NOW
// TODO: 同步时间不由文字记录，由插件选择日期

dayjs.extend(customParseFormat);

const displayCategorizedTodos = async () => {
  const sortedTodos = await categorizeAndSortTodos();
  console.log(sortedTodos);
};

const App = () => {
  const [todoList, setTodoList] = useState<TodoItemType[]>([]);
  const settings = useRecoilValue(settingsState);

  const [error, setError] = useState<ErrorAlertProps["message"]>();

  console.log("settings", settings);

  const handleGetTodayTodo = async () => {
    try {
      const todo = await getTodayTodo();
      const handleLogseqMapItem = curryHandleLogseqMapItem(dayjs().format());
      const tasks = todo.map(handleLogseqMapItem);
      const resolvedTasks = await Promise.all(tasks);
      setTodoList(resolvedTasks);
    } catch (error: unknown) {
      handleError(error, setError);
    }
  };

  const fetchAndSyncTodos = async () => {
    const todo = await getTodayTodo();
    const handleLogseqMapItem = curryHandleLogseqMapItem(dayjs().format());
    const tasks = todo.map(handleLogseqMapItem);

    const resolvedTasks = await Promise.all(tasks);
    setTodoList(resolvedTasks);

    console.log(resolvedTasks);
    handleSyncTodo(resolvedTasks, settings);
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

        {error && <ErrorAlert message={error} />}

        <h2 className="text-2xl mt-6">Todos:</h2>
        <div className="grid gap-4">
          <Button
            className="inline-flex items-center justify-center w-full  gap-4"
            onClick={async () => {
              try {
                const todoList = await getAllTodoList();
                setTodoList(todoList);
              } catch (error) {
                handleError(error, setError);
              }
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
            onClick={fetchAndSyncTodos}
          >
            Sync
          </Button>

          <div className="grid gap-4 overflow-y-auto scrollbar-hide max-h-[240px]">
            <TodoList todos={todoList} />
          </div>
          <TodoTable />
        </div>
      </div>
    </div>
  );
};

export default App;
