/**
 * Interface copy in Chinese and English.
 *
 * Keys are the Chinese text, so a missing translation degrades to readable
 * Chinese instead of a raw identifier. The active language follows the DSH page
 * language (`<html lang>`), which the shell sets from the user's locale.
 */

/** Supported interface languages. */
export type Lang = 'zh' | 'en'

/** English copy, keyed by the Chinese source text. */
const EN: Record<string, string> = {
  // shell
  日程: 'Schedule',
  日历: 'Calendar',
  课表: 'Timetable',
  规划: 'Plans',
  设置: 'Settings',
  '载入中…': 'Loading…',
  关闭: 'Close',
  取消: 'Cancel',
  保存: 'Save',
  删除: 'Delete',
  编辑: 'Edit',
  添加: 'Add',
  重试: 'Retry',
  选填: 'optional',

  // calendar
  上一页: 'Previous',
  下一页: 'Next',
  今天: 'Today',
  月: 'M',
  周: 'W',
  日: 'D',
  '视图': 'View',
  '新建': 'New',
  '这一天还没有安排': 'Nothing planned for this day',
  '点右上角「新建」添加一条，或在对话框里直接说「明天下午三点组会」。':
    'Use “New” above, or just tell the assistant “team meeting tomorrow at 3pm”.',
  '全天': 'All day',

  // event editor
  新建日程: 'New event',
  编辑日程: 'Edit event',
  标题: 'Title',
  日期: 'Date',
  开始: 'Start',
  结束: 'End',
  地点: 'Location',
  备注: 'Notes',
  提前提醒: 'Remind me',
  准时: 'On time',
  重复: 'Repeat',
  重复截止: 'Repeat until',
  星期: 'Weekdays',
  颜色: 'Color',
  不重复: 'Does not repeat',
  每天: 'Daily',
  工作日: 'Weekdays',
  每周: 'Weekly',
  每两周: 'Every two weeks',
  每月: 'Monthly',
  '例如：高等数学第 3 章复习': 'e.g. Review chapter 3 of Calculus',
  '请填写标题': 'Please add a title',
  '结束时间不能早于开始时间': 'The end must not be before the start',
  '{n} 分钟': '{n} min',

  // timetable
  课表未启用: 'Timetable is off',
  '启用后可以按学期周次查看课程，并支持粘贴文本、手动录入或导入 CSV。':
    'Turn it on to see courses by teaching week, and to paste, type or import a timetable.',
  启用课表: 'Turn on the timetable',
  上一周: 'Previous week',
  本周: 'This week',
  下一周: 'Next week',
  '第 {n} 周': 'Week {n}',
  '（本周是第 {n} 周）': '(this week is week {n})',
  导入: 'Import',
  '+ 添加课程': '+ Add course',
  还没有节次时间: 'No bell schedule yet',
  '先到设置里配置每天第几节几点上课，课表格子才能排出来。':
    'Set the period times in Settings first, then the grid can be laid out.',
  节次: 'Period',
  '第 {n} 节': 'P{n}',
  '添加课程': 'Add course',
  '编辑课程': 'Edit course',
  课程名称: 'Course',
  教师: 'Teacher',
  起始节: 'First period',
  结束节: 'Last period',
  起始周: 'First week',
  结束周: 'Last week',
  单双周: 'Week parity',
  单周: 'Odd weeks',
  双周: 'Even weeks',
  '请填写课程名称': 'Please add a course name',
  '本学期共 {total} 周，已录入 {courses} 门课程，本周显示 {visible} 门。':
    'The term runs {total} weeks; {courses} courses saved, {visible} shown this week.',
  '导入课表': 'Import timetable',
  '三种方式任选：让 AI 解析你粘贴的课表文字、选择教务系统导出的 CSV 文件，或按下面的列顺序自己排版。':
    'Choose one: let the AI parse pasted text, pick a CSV exported by your school system, or lay it out yourself in the column order below.',
  '选择 CSV 文件': 'Choose a CSV file',
  'AI 解析这段文本': 'Parse this text with AI',
  '解析中…': 'Parsing…',
  '填入示例': 'Fill in a sample',
  '粘贴内容': 'Paste here',
  'CSV 列格式': 'CSV columns',
  '覆盖已有课程（不勾选则追加）': 'Replace existing courses (unchecked appends)',
  '识别到 {n} 门课程': '{n} courses found',
  '，{n} 行无法识别': ', {n} lines unreadable',
  '导入 {n} 门': 'Import {n}',
  '也可以直接贴教务系统复制的课表文字，再点「AI 解析」':
    'You can also paste timetable text copied from your school system, then press “Parse with AI”.',
  '例如：高等数学': 'e.g. Calculus',
  '由 {model} 解析出 {n} 门课程': '{model} parsed {n} courses',
  '删除第 {n} 节': 'Delete period {n}',
  '例如：期末复习完高数': 'e.g. Finish the Calculus revision',
  '删除里程碑': 'Delete milestone',
  '‹ 全部目标': '‹ All goals',
  说明: 'Notes',
  '+ 增加一节': '+ Add a period',

  // plans
  长期目标: 'Long-term goals',
  '+ 新建目标': '+ New goal',
  还没有目标: 'No goals yet',
  '把一个长期任务拆成几个里程碑，进度就会一目了然。比如「期末复习」拆成三章 + 两套真题。':
    'Split a long task into milestones and the progress becomes obvious — e.g. “Final review” into three chapters and two mock exams.',
  '{n}% 完成': '{n}% done',
  '截止 {date}': 'Due {date}',
  '还有 {n} 天': '{n} days left',
  '已逾期 {n} 天': '{n} days overdue',
  今天截止: 'Due today',
  明天截止: 'Due tomorrow',
  '{done}/{total} 个里程碑': '{done}/{total} milestones',
  已完成: 'Done',
  重要: 'Important',
  全部目标: 'All goals',
  里程碑: 'Milestones',
  '加一个里程碑，回车确认': 'Add a milestone, press Enter',
  目标: 'Goal',
  '选填：为什么要做、做到什么程度算完成': 'optional: why, and what done looks like',
  截止日: 'Due date',
  优先级: 'Priority',
  低: 'Low',
  普通: 'Normal',
  新建目标: 'New goal',
  编辑目标: 'Edit goal',
  '还没有里程碑，点「编辑」把它们加进来。': 'No milestones yet — add them from “Edit”.',
  '请填写目标名称': 'Please add a goal name',

  // quick add
  '一句话添加，例如：明天下午三点组会，提前十分钟提醒':
    'One sentence, e.g. “team meeting tomorrow at 3pm, remind me 10 minutes before”',
  解析: 'Parse',
  '识别到 {n} 条日程 · 由 {model} 解析': '{n} events found · parsed by {model}',
  全部添加: 'Add all',
  解析结果: 'Parsed events',
  '解析结果先预览再落库；有问题就改一下措辞重新解析。':
    'Nothing is stored until you confirm; rephrase and parse again if it looks wrong.',

  // notices
  日程提醒: 'Calendar reminder',
  错过的提醒: 'Missed reminder',
  '提前 {n} 分钟': '{n} min ahead',
  完成: 'Done',
  '5 分钟后': 'In 5 min',
  '10 分钟后': 'In 10 min',

  // settings
  '启用课表（关闭后左侧栏不再显示课表页）': 'Enable the timetable (hides its tab when off)',
  开学第一周的周一: 'Monday of week 1',
  总周数: 'Weeks in term',
  节次时间: 'Period times',
  '增加一节': '+ Add a period',
  保存节次: 'Save periods',
  提醒: 'Reminders',
  提醒时播放提示音: 'Play a sound with reminders',
  '同时发系统通知（DSH 最小化时也能看到）': 'Also raise a system notification (visible when DSH is minimised)',
  免打扰时段: 'Quiet hours',
  从: 'From',
  到: 'To',
  每周从: 'Week starts on',
  周一开始: 'Monday',
  周日开始: 'Sunday',
  新建日程默认提前提醒: 'Default lead time for new events',
  准时提醒: 'On time',
  数据: 'Data',
  '导出 ICS': 'Export ICS',
  '导入 ICS': 'Import ICS',
  导出备份: 'Export backup',
  恢复备份: 'Restore backup',
  '恢复备份会覆盖当前的日程、课表和目标，确定继续？': 'Restoring replaces the current events, timetable and goals. Continue?',
  '已导出 {n} 条日程为 ICS': 'Exported {n} events as ICS',
  '已导出 JSON 备份': 'JSON backup exported',
  '已从 {file} 恢复': 'Restored from {file}',
  '从 {file} 导入 {n} 条': 'Imported {n} events from {file}',
  '，跳过 {n} 条': ', skipped {n}',
  '数据文件：': 'Data file: ',
}

/** Current interface language. */
let current: Lang = 'zh'

/** Read the DSH page language once, at module load. */
function detect(): Lang {
  try {
    const lang = document.documentElement.lang || navigator.language || 'zh'
    return lang.toLowerCase().startsWith('en') ? 'en' : 'zh'
  } catch {
    return 'zh'
  }
}

current = detect()

/** The language in use. */
export function language(): Lang {
  return current
}

/**
 * Translate one string.
 * @param zh - the Chinese source text, which doubles as the dictionary key.
 * @param params - values for `{name}` placeholders.
 * @returns the copy in the active language.
 */
export function t(zh: string, params?: Record<string, string | number>): string {
  const template = current === 'en' ? (EN[zh] ?? zh) : zh
  if (params === undefined) return template
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in params ? String(params[key]) : match))
}

/**
 * Build a translator bound to the active language.
 * Components call this once per render; DSH reloads the page on a language
 * change, so no subscription is needed.
 * @returns the bound translator.
 */
export function useT(): typeof t {
  return t
}
