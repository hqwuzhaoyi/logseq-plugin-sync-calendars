import "./App.css";
import { useState } from "react";

// TODO 获取今日最新的todo 然后写入到Calendar中

const App = () => {
  console.log(import.meta.env.VITE_APPLE_USER_NAME);
  const [todos, setTodos] = useState([]);
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
    setTodos(todos.map((todo) => todo[0]));
    console.log(todos);
  };

  const getBlock = async () => {
    const block = await logseq.Editor.getBlock("");
    console.log(block);
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
