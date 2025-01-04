import dayjs from "dayjs";
import { getAllTodoList } from "@/lib/logseq/getAllTodoList";

export const categorizeAndSortTodos = async () => {
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
