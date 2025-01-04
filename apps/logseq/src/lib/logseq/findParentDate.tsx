import dayjs from "dayjs";

export const findParentDate = async (parentId) => {
  if (!parentId) return null;

  const parentBlock = await logseq.Editor.getBlock(parentId, {
    includeChildren: true,
  });
  while (parentBlock) {
    const parentContent = parentBlock.content;
    const journalDayMatch = parentContent.match(/\d{8}/); // 匹配 8 位日期，例如 20240813
    if (journalDayMatch) {
      const journalDay = journalDayMatch[0];
      return {
        scheduledTimeText: dayjs(journalDay, "YYYYMMDD").format(
          "YYYY-MM-DDTHH:mm:ss"
        ),
        scheduledTime: dayjs(journalDay, "YYYYMMDD").valueOf(),
        isAllDay: true,
      };
    }
    if (!parentBlock.parent?.id) break; // 如果没有父块，退出循环
    const page = await logseq.Editor.getPage(parentBlock.parent.id, {
      includeChildren: true,
    }); // 获取上一级父块

    if (page) {
      return {
        scheduledTimeText: dayjs(page.journalDay + "", "YYYYMMDD").format(
          "YYYY-MM-DDTHH:mm:ss"
        ),
        scheduledTime: dayjs(page.journalDay + "", "YYYYMMDD").valueOf(),
        isAllDay: true,
      };
    }
  }

  if (!parentBlock) {
    const page = await logseq.Editor.getPage(parentId, {
      includeChildren: true,
    }); // 获取上一级父块

    if (page) {
      return {
        scheduledTimeText: dayjs(page.journalDay + "", "YYYYMMDD").format(
          "YYYY-MM-DDTHH:mm:ss"
        ),
        scheduledTime: dayjs(page.journalDay + "", "YYYYMMDD").valueOf(),
        isAllDay: true,
      };
    }
  }

  return null;
};
