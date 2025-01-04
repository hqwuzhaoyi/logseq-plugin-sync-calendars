import { handleLogseqToList } from "@/lib/logseq/handleLogseqToList";
import type { TodoItemType, LogseqTodo } from "../../types";


export const getAllTodoList = async (): Promise<TodoItemType[]> => {
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
