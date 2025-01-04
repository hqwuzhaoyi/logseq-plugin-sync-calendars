import { ofetch } from "ofetch";

// Function to add/update the calendar UID in the task block after sync
const addCalendarUid = async (blockId, newCalendarUid) => {
  await logseq.Editor.upsertBlockProperty(
    blockId,
    "calendarUid",
    newCalendarUid
  );
};

export const handleSyncTodo = async (resolvedTasks, settings) => {
  const serverUrl =
    import.meta.env.VITE_MODE === "web"
      ? "http://localhost:3010/calendar"
      : settings.serverUrl;

  if (!serverUrl) {
    console.error("Server URL is not set.");
    return;
  }

  try {
    const syncResults = await ofetch(serverUrl, {
      method: "POST",
      body: { tasks: resolvedTasks },
    });

    for (const task of resolvedTasks) {
      const syncResult = syncResults.find((res) => res.id === task.id);
      if (syncResult && syncResult.calendarUid) {
        // 如果服务端返回了 `calendarUid`，说明任务已同步，更新任务块的 `calendarUid`
        await addCalendarUid(task.id, syncResult.calendarUid);
      }
    }

    console.log("Tasks successfully sent to backend for synchronization.");
  } catch (error) {
    console.error("Error sending tasks to backend:", error);
  }
};
