import dayjs from "dayjs";
import "./App.css";
import { useState } from "react";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { ofetch } from "ofetch";

dayjs.extend(customParseFormat);

const App = () => {
  console.log(import.meta.env.VITE_APPLE_USER_NAME);
  const [todos, setTodos] = useState<
    {
      text: string;
      scheduledTime: string;
    }[]
  >([]);
  const getTodayTodos = async () => {
    const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const todos = await logseq.DB.datascriptQuery(`
      [:find ?content
       :where
       (or
         [?b :block/marker "TODO"]
         [?b :block/marker "SCHEDULED"])
       [?b :block/page ?p]
       [?p :block/journal? true]
       [?p :block/journal-day ${today}]
       [?b :block/content ?content]]
    `);

    const tasks = todos.map((task) => {
      const content = task[0];
      const text = content
        .replace(/^TODO\s*/, "")
        .replace(/SCHEDULED:.*$/, "")
        .trim();
      const scheduledMatch = content.match(/SCHEDULED:\s*<([^>]+)>/);
      const scheduledTime = scheduledMatch
        ? dayjs(scheduledMatch[1], "YYYY-MM-DD ddd HH:mm")
            .toDate()
            .toISOString()
        : dayjs().toDate().toISOString();
      return { text, scheduledTime };
    });
    setTodos(tasks);

    console.log(todos);
    try {
      await ofetch("http://localhost:3000/calc", {
        method: "POST",
        body: { tasks },
      });
      console.log("Tasks successfully sent to backend for synchronization.");
    } catch (error) {
      console.error("Error sending tasks to backend:", error);
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center text-white">
      <div
        className="w-screen h-screen fixed top-0 left-0"
        onClick={() => logseq.hideMainUI()}
      ></div>
      <div className="w-5/6 h-5/6 z-0 bg-gradient-to-tr from-green-300 via-green-500 to-green-700 flex flex-col items-center justify-center">
        <h1 className="font-bold text-4xl">Logseq-plugin-react-boilerplate</h1>
        <h2 className="text-2xl mt-6">
          Current Env: {import.meta.env.VITE_MODE}
        </h2>

        <h2 className="text-2xl mt-6">Todos:</h2>
        <ul>
          {todos.map((todo, index) => (
            <li key={index}>
              {todo.text} {todo.scheduledTime}
            </li>
          ))}
        </ul>
        <button
          className="mt-6 bg-white text-black px-4 py-2 rounded"
          onClick={getTodayTodos}
        >
          Get Block
        </button>
      </div>
    </div>
  );
};

export default App;
