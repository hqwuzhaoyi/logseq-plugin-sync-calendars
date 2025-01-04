export type LogseqTodo = {
  properties: Record<string, unknown>;
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

export type TodoItemType = {
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
