export interface LogeseqTodo {
    text: string;
    scheduledTime: string;
    uid: string;
    isAllDay: boolean;
}
export declare function syncCalendar(logseqTodos: LogeseqTodo[]): Promise<void>;
//# sourceMappingURL=index.d.ts.map