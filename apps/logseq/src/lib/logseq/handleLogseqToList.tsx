import { curryHandleLogseqMapItem } from "./curryHandleLogseqMapItem";
import type { LogseqTodo, TodoItemType } from "../../types";


export const handleLogseqToList: ((todoBlocks: [LogseqTodo][]) => Promise<TodoItemType[]>) |
  undefined = async (todoBlocks) => {
    const handleLogseqMapItem = curryHandleLogseqMapItem();
    const result = await Promise.all(todoBlocks.map(handleLogseqMapItem));
    return result;
  };
