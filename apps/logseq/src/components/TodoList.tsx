import type { TodoItemType } from "../types";
import { Label } from "@/components/ui/label";

export const TodoList = ({ todos }: { todos: TodoItemType[] }) => {
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
