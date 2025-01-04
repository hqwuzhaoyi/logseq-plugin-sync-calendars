import dayjs from "dayjs";
import type { LogseqTodo } from "../../types";

export const getTodayTodo = async () => {
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
