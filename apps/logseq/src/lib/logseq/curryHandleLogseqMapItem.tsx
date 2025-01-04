import dayjs from "dayjs";
import { findParentDate } from "./findParentDate";

export const curryHandleLogseqMapItem = (defaultDay?: string) =>
  async ([block]) => {
    const marker = block.marker;
    const scheduledMatch = block.content.match(/SCHEDULED:\s*<([^>]+)>/);
    const content = block.content; // 获取块的内容
    const text = content
      .replace(/^TODO\s*/, "")
      .replace(/SCHEDULED:.*$/, "")
      .trim();
    let scheduledTimeText;
    let isAllDay = false;
    let scheduledTime;

    if (scheduledMatch) {
      const dateString = scheduledMatch[1];

      if (dateString.length === 14) {
        // 如果日期格式为 YYYYMMDD
        scheduledTimeText = dayjs(dateString, "YYYY-MM-DD").format(
          "YYYY-MM-DDTHH:mm:ss"
        );
        scheduledTime = dayjs(dateString, "YYYYMMDD").valueOf();
        isAllDay = true; // 没有时间信息，则为全天事件
      } else if (dateString.length > 14) {
        // 如果日期格式包含时间
        scheduledTimeText = dayjs(dateString, "YYYY-MM-DD HH:mm").format(
          "YYYY-MM-DDTHH:mm:ss"
        );
        scheduledTime = dayjs(dateString, "YYYY-MM-DD HH:mm").valueOf();
        isAllDay = scheduledTimeText.endsWith("00:00:00"); // 如果时间部分为00:00:00，则为全天事件
      }
    } else if (defaultDay) {
      scheduledTimeText = dayjs(defaultDay).format("YYYY-MM-DDTHH:mm:ss");
      scheduledTime = dayjs(defaultDay).valueOf();
      isAllDay = true;
    } else {
      // TODO: 从logseq向上查找日期
      const parentDate = await findParentDate(block.parent?.id);
      if (parentDate) {
        scheduledTimeText = parentDate.scheduledTimeText;
        scheduledTime = parentDate.scheduledTime;
        isAllDay = parentDate.isAllDay;
      } else if (block["journal-day"]) {
        // 如果块直接有 journal-day 属性，使用它
        const journalDay = block["journal-day"];
        scheduledTimeText = dayjs(journalDay, "YYYYMMDD").format(
          "YYYY-MM-DDTHH:mm:ss"
        );
        scheduledTime = dayjs(journalDay, "YYYYMMDD").valueOf();
        isAllDay = true;
      } else {
        scheduledTimeText = "No Date";
        scheduledTime = 0;
        isAllDay = false;
      }
    }

    /**
     * 获取日历的 uid
     */
    const calendarUid = block.properties?.calendarUid || null;

    return {
      ...block,
      calendarUid,
      type: marker === "TODO" ? "TODO" : "SCHEDULED",
      isAllDay,
      scheduledTime,
      scheduledTimeText,
      text,
    };
  };
