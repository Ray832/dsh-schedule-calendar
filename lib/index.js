// src/index.ts
import { randomUUID } from "node:crypto";
import { join as join2 } from "node:path";

// src/ai.ts
var ParseError = class extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.code = code;
  }
};
function nowFacts(now) {
  const pad2 = (n) => String(n).padStart(2, "0");
  const weekday = ["\u65E5", "\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D"][now.getDay()];
  return `\u73B0\u5728\u662F ${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}T${pad2(now.getHours())}:${pad2(now.getMinutes())}\uFF08\u661F\u671F${weekday}\uFF09\uFF0C\u65F6\u533A ${Intl.DateTimeFormat().resolvedOptions().timeZone}\u3002`;
}
function extractJson(text) {
  let body = text.trim();
  const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(body);
  if (fence?.[1] !== void 0) body = fence[1].trim();
  const firstArray = body.indexOf("[");
  const firstObject = body.indexOf("{");
  const start = firstArray < 0 ? firstObject : firstObject < 0 ? firstArray : Math.min(firstArray, firstObject);
  if (start < 0) throw new ParseError("parse-failed", "\u6A21\u578B\u6CA1\u6709\u8FD4\u56DE\u53EF\u89E3\u6790\u7684\u5185\u5BB9");
  const open = body[start];
  const close = open === "[" ? body.lastIndexOf("]") : body.lastIndexOf("}");
  if (close < start) throw new ParseError("parse-failed", "\u6A21\u578B\u8FD4\u56DE\u7684 JSON \u4E0D\u5B8C\u6574");
  return body.slice(start, close + 1);
}
async function ask(llm, route, system, user, signal) {
  let text = "";
  const stream = llm.stream({
    provider: route.provider,
    model: route.model,
    system,
    messages: [{ role: "user", content: [{ type: "text", text: user }] }],
    maxTokens: 1200,
    temperature: 0.1,
    ...signal !== void 0 ? { signal } : {}
  });
  for await (const chunk of stream) {
    if (chunk.type === "text-delta" && typeof chunk.text === "string") text += chunk.text;
  }
  if (text.trim() === "") throw new ParseError("empty-answer", "\u6A21\u578B\u6CA1\u6709\u8FD4\u56DE\u5185\u5BB9");
  return text;
}
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function normalizeStamp(value) {
  if (typeof value !== "string") return null;
  const text = value.trim().replace(" ", "T");
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(text);
  if (match === null) return null;
  const [, y, m, d, hh, mm] = match;
  return `${y}-${m}-${d}T${hh ?? "00"}:${mm ?? "00"}`;
}
function normalizeEventRow(raw) {
  if (raw === null || typeof raw !== "object") return null;
  const row = raw;
  const title = typeof row.title === "string" ? row.title.trim() : "";
  const start = normalizeStamp(row.start);
  if (title === "" || start === null) return null;
  const end = normalizeStamp(row.end) ?? start;
  const allDay = row.allDay === true || start.endsWith("T00:00");
  const leads = Array.isArray(row.remindBefore) ? row.remindBefore.map((v) => Number(v)).filter((v) => Number.isFinite(v) && v >= 0).slice(0, 5) : [];
  const rawRepeat = row.repeat ?? {};
  const kind = String(rawRepeat.kind ?? "none");
  const allowed = ["none", "daily", "weekly", "monthly", "weekdays", "biweekly"];
  const repeat = { kind: allowed.includes(kind) ? kind : "none" };
  if (Array.isArray(rawRepeat.weekdays)) {
    const days = rawRepeat.weekdays.map((v) => Number(v)).filter((v) => Number.isInteger(v) && v >= 1 && v <= 7);
    if (days.length > 0) repeat.weekdays = [...new Set(days)].sort((a, b) => a - b);
  }
  if (typeof rawRepeat.until === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawRepeat.until)) repeat.until = rawRepeat.until;
  return {
    title: title.slice(0, 200),
    start,
    end: end < start ? start : end,
    allDay,
    ...typeof row.location === "string" && row.location.trim() !== "" ? { location: row.location.trim().slice(0, 200) } : {},
    remindBefore: [...new Set(leads)].sort((a, b) => a - b),
    repeat
  };
}
var EVENT_SYSTEM = `\u4F60\u662F\u4E00\u4E2A\u65E5\u5386\u89E3\u6790\u5668\uFF0C\u53EA\u8F93\u51FA JSON\uFF0C\u4E0D\u8981\u4EFB\u4F55\u89E3\u91CA\u3001markdown \u6216\u4EE3\u7801\u5757\u6807\u8BB0\u3002
\u628A\u7528\u6237\u7684\u4E00\u53E5\u8BDD\u89E3\u6790\u6210\u96F6\u5230\u591A\u6761\u65E5\u7A0B\uFF0C\u8F93\u51FA\u4E00\u4E2A JSON \u6570\u7EC4\u3002\u6BCF\u6761\u5BF9\u8C61\u7684\u5B57\u6BB5\uFF1A
- title: \u5B57\u7B26\u4E32\uFF0C\u65E5\u7A0B\u6807\u9898\uFF0C\u53BB\u6389\u300C\u63D0\u9192\u6211\u300D\u300C\u5E2E\u6211\u52A0\u300D\u8FD9\u7C7B\u7948\u4F7F\u53E5
- start: "YYYY-MM-DDTHH:mm"\uFF0C\u672C\u5730\u65F6\u95F4
- end: "YYYY-MM-DDTHH:mm"\uFF0C\u7F3A\u7701\u65F6\u6309 1 \u5C0F\u65F6
- allDay: \u5E03\u5C14\uFF0C\u53EA\u6709\u300C\u5168\u5929\u300D\u300C\u4E00\u6574\u5929\u300D\u624D\u4E3A true
- location: \u5B57\u7B26\u4E32\uFF0C\u53EF\u9009\uFF0C\u6CA1\u6709\u5C31\u4E0D\u5199
- remindBefore: \u5206\u949F\u6570\u6570\u7EC4\uFF0C\u4F8B\u5982 [10]\uFF1B\u7528\u6237\u8BF4\u300C\u63D0\u524D\u5341\u5206\u949F\u300D\u5C31\u662F [10]\uFF0C\u6CA1\u8BF4\u5C31\u5199 [10]
- repeat: \u5BF9\u8C61\uFF0C{"kind":"none"}\uFF1B\u6BCF\u5929\u7528 daily\uFF0C\u6BCF\u5468\u7528 weekly \u5E76\u7ED9 weekdays\uFF081=\u5468\u4E00\u20267=\u5468\u65E5\uFF09\uFF0C
  \u5DE5\u4F5C\u65E5\u7528 weekdays\uFF0C\u6BCF\u6708\u7528 monthly\uFF0C\u6BCF\u4E24\u5468\u7528 biweekly
\u89C4\u5219\uFF1A\u76F8\u5BF9\u65F6\u95F4\uFF08\u660E\u5929\u3001\u4E0B\u5468\u4E09\u3001\u4ECA\u665A\uFF09\u90FD\u8981\u6362\u7B97\u6210\u7EDD\u5BF9\u65E5\u671F\uFF1B\u4E0D\u786E\u5B9A\u5C31\u53D6\u6700\u63A5\u8FD1\u7684\u672A\u6765\u65F6\u95F4\uFF1B\u6CA1\u6709\u65F6\u95F4\u5C31\u53D6\u6B21\u65E5 09:00\u3002`;
var COURSE_SYSTEM = `\u4F60\u662F\u4E00\u4E2A\u8BFE\u8868\u89E3\u6790\u5668\uFF0C\u53EA\u8F93\u51FA JSON\uFF0C\u4E0D\u8981\u4EFB\u4F55\u89E3\u91CA\u3001markdown \u6216\u4EE3\u7801\u5757\u6807\u8BB0\u3002
\u628A\u7528\u6237\u63D0\u4F9B\u7684\u8BFE\u8868\u6587\u672C\u89E3\u6790\u6210\u8BFE\u7A0B\u6570\u7EC4\u3002\u6BCF\u6761\u5BF9\u8C61\u7684\u5B57\u6BB5\uFF1A
- name: \u8BFE\u7A0B\u540D\u79F0
- teacher: \u6559\u5E08\uFF0C\u53EF\u9009
- location: \u4E0A\u8BFE\u5730\u70B9\uFF0C\u53EF\u9009
- weekday: 1-7 \u7684\u6574\u6570\uFF0C1 \u8868\u793A\u5468\u4E00
- periods: \u8282\u6B21\u6570\u7EC4\uFF0C\u4F8B\u5982 [1,2] \u8868\u793A\u7B2C 1\u30012 \u8282
- weeks: {"from": \u8D77\u59CB\u5468, "to": \u7ED3\u675F\u5468}
- parity: "all" | "odd" | "even"\uFF0C\u5355\u5468\u662F odd\uFF0C\u53CC\u5468\u662F even
\u4E00\u95E8\u8BFE\u5728\u591A\u4E2A\u65F6\u95F4\u6BB5\u4E0A\u8BFE\u65F6\uFF0C\u62C6\u6210\u591A\u6761\u3002`;
async function parseEvents(llm, route, text, signal) {
  const answer = await ask(llm, route, EVENT_SYSTEM, `${nowFacts(/* @__PURE__ */ new Date())}
\u7528\u6237\u8BF4\uFF1A${text}`, signal);
  let parsed;
  try {
    parsed = JSON.parse(extractJson(answer));
  } catch (error) {
    if (error instanceof ParseError) throw error;
    throw new ParseError("parse-failed", "\u6A21\u578B\u8FD4\u56DE\u7684\u4E0D\u662F\u5408\u6CD5 JSON");
  }
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  const events = rows.map(normalizeEventRow).filter((row) => row !== null);
  if (events.length === 0) throw new ParseError("no-events", "\u6CA1\u6709\u4ECE\u8FD9\u53E5\u8BDD\u91CC\u8BC6\u522B\u51FA\u65E5\u7A0B\uFF0C\u6362\u4E2A\u8BF4\u6CD5\u8BD5\u8BD5");
  return events;
}
async function parseCourses(llm, route, text, signal) {
  const answer = await ask(llm, route, COURSE_SYSTEM, text.slice(0, 6e3), signal);
  let parsed;
  try {
    parsed = JSON.parse(extractJson(answer));
  } catch (error) {
    if (error instanceof ParseError) throw error;
    throw new ParseError("parse-failed", "\u6A21\u578B\u8FD4\u56DE\u7684\u4E0D\u662F\u5408\u6CD5 JSON");
  }
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  const courses = [];
  for (const raw of rows) {
    if (raw === null || typeof raw !== "object") continue;
    const row = raw;
    const name2 = typeof row.name === "string" ? row.name.trim() : "";
    const weekday = Number(row.weekday);
    const periods = Array.isArray(row.periods) ? row.periods.map((p) => Number(p)).filter((p) => Number.isInteger(p) && p >= 1 && p <= 24) : [];
    if (name2 === "" || !Number.isInteger(weekday) || weekday < 1 || weekday > 7 || periods.length === 0) continue;
    const weeks = row.weeks ?? {};
    const from = clamp(Number(weeks.from ?? 1) || 1, 1, 60);
    const to = clamp(Number(weeks.to ?? 20) || 20, 1, 60);
    const parityRaw = String(row.parity ?? "all");
    courses.push({
      name: name2.slice(0, 100),
      ...typeof row.teacher === "string" && row.teacher.trim() !== "" ? { teacher: row.teacher.trim().slice(0, 100) } : {},
      ...typeof row.location === "string" && row.location.trim() !== "" ? { location: row.location.trim().slice(0, 100) } : {},
      weekday,
      periods: [...new Set(periods)].sort((a, b) => a - b),
      weeks: { from: Math.min(from, to), to: Math.max(from, to) },
      parity: parityParity(parityRaw)
    });
  }
  if (courses.length === 0) throw new ParseError("no-courses", "\u6CA1\u6709\u8BC6\u522B\u51FA\u8BFE\u7A0B\uFF0C\u68C0\u67E5\u4E00\u4E0B\u6587\u672C\u683C\u5F0F");
  return courses;
}
function parityParity(value) {
  if (value === "odd" || value.includes("\u5355")) return "odd";
  if (value === "even" || value.includes("\u53CC")) return "even";
  return "all";
}

// src/ics.ts
var BYDAY = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
function escapeText(value) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}
function unescapeText(value) {
  return value.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
}
function toIcsStamp(local, allDay) {
  const date = local.slice(0, 10).replace(/-/g, "");
  if (allDay) return date;
  const time = (local.length >= 16 ? local.slice(11, 16) : "00:00").replace(":", "");
  return `${date}T${time}00`;
}
function fromIcsStamp(value, fallbackAllDay) {
  const clean = value.replace(/^[^:]*:/, "").trim();
  const dateOnly = /^(\d{4})(\d{2})(\d{2})$/.exec(clean);
  if (dateOnly !== null) {
    return { stamp: `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}T00:00`, allDay: true };
  }
  const full = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?Z?$/.exec(clean);
  if (full !== null) {
    return { stamp: `${full[1]}-${full[2]}-${full[3]}T${full[4]}:${full[5]}`, allDay: fallbackAllDay };
  }
  return null;
}
function toRrule(repeat) {
  if (repeat === void 0 || repeat.kind === "none") return void 0;
  const days = (repeat.weekdays ?? []).map((day) => BYDAY[day - 1]).filter(Boolean);
  const parts = [];
  switch (repeat.kind) {
    case "daily":
      parts.push("FREQ=DAILY");
      break;
    case "weekdays":
      parts.push("FREQ=WEEKLY", "BYDAY=MO,TU,WE,TH,FR");
      break;
    case "weekly":
      parts.push("FREQ=WEEKLY");
      if (days.length > 0) parts.push(`BYDAY=${days.join(",")}`);
      break;
    case "biweekly":
      parts.push("FREQ=WEEKLY", "INTERVAL=2");
      if (days.length > 0) parts.push(`BYDAY=${days.join(",")}`);
      break;
    case "monthly":
      parts.push("FREQ=MONTHLY");
      break;
    default:
      return void 0;
  }
  if (repeat.until !== void 0) parts.push(`UNTIL=${repeat.until.replace(/-/g, "")}T235900`);
  return parts.join(";");
}
function fold(line) {
  if (line.length <= 72) return line;
  const chunks = [];
  let rest = line;
  while (rest.length > 72) {
    chunks.push(rest.slice(0, 72));
    rest = ` ${rest.slice(72)}`;
  }
  chunks.push(rest);
  return chunks.join("\r\n");
}
function toIcs(events, name2 = "DSH Schedule") {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//dsh-schedule-calendar//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeText(name2)}`
  ];
  const stamp2 = (/* @__PURE__ */ new Date()).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  for (const event of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${event.id}@dsh-schedule-calendar`);
    lines.push(`DTSTAMP:${stamp2}`);
    lines.push(`DTSTART:${toIcsStamp(event.start, event.allDay)}`);
    lines.push(`DTEND:${toIcsStamp(event.end, event.allDay)}`);
    lines.push(fold(`SUMMARY:${escapeText(event.title)}`));
    if (event.location !== void 0) lines.push(fold(`LOCATION:${escapeText(event.location)}`));
    if (event.note !== void 0) lines.push(fold(`DESCRIPTION:${escapeText(event.note)}`));
    const rrule = toRrule(event.repeat);
    if (rrule !== void 0) lines.push(`RRULE:${rrule}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r
`;
}
function unfold(text) {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").reduce((lines, line) => {
    if (/^[ \t]/.test(line) && lines.length > 0) lines[lines.length - 1] += line.slice(1);
    else lines.push(line);
    return lines;
  }, []).filter((line) => line.trim() !== "");
}
function fromRrule(value) {
  const fields = /* @__PURE__ */ new Map();
  for (const part of value.split(";")) {
    const [key, raw] = part.split("=");
    if (key !== void 0 && raw !== void 0) fields.set(key.trim().toUpperCase(), raw.trim());
  }
  const freq = fields.get("FREQ")?.toUpperCase() ?? "";
  const interval = Number(fields.get("INTERVAL") ?? "1");
  const byday = (fields.get("BYDAY") ?? "").split(",").map((code) => BYDAY.indexOf(code.trim().slice(-2).toUpperCase()) + 1).filter((day) => day >= 1 && day <= 7);
  let kind = "none";
  if (freq === "DAILY") kind = "daily";
  else if (freq === "WEEKLY") {
    const weekdays = byday.length > 0 ? [...byday].sort((a, b) => a - b) : void 0;
    const isWorkdays = weekdays?.length === 5 && weekdays.every((day, index) => day === index + 1);
    if (isWorkdays) kind = "weekdays";
    else kind = interval >= 2 ? "biweekly" : "weekly";
  } else if (freq === "MONTHLY") kind = "monthly";
  const repeat = { kind };
  if ((kind === "weekly" || kind === "biweekly") && byday.length > 0) {
    repeat.weekdays = [...byday].sort((a, b) => a - b);
  }
  const until = fields.get("UNTIL");
  if (until !== void 0 && /^\d{8}/.test(until)) repeat.until = `${until.slice(0, 4)}-${until.slice(4, 6)}-${until.slice(6, 8)}`;
  return repeat;
}
function fromIcs(text) {
  const lines = unfold(text);
  const events = [];
  let current = null;
  let skipped = 0;
  for (const line of lines) {
    const upper = line.toUpperCase();
    if (upper === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (upper === "END:VEVENT") {
      if (current !== null) {
        const start = current.DTSTART !== void 0 ? fromIcsStamp(current.DTSTART, false) : null;
        if (current.SUMMARY === void 0 || start === null) {
          skipped += 1;
        } else {
          const allDay = current.DTSTART?.startsWith("VALUE=DATE") === true || start.allDay;
          const end = current.DTEND !== void 0 ? fromIcsStamp(current.DTEND, allDay) : null;
          events.push({
            title: unescapeText(current.SUMMARY),
            start: start.stamp,
            end: end?.stamp ?? start.stamp,
            allDay,
            ...current.LOCATION !== void 0 ? { location: unescapeText(current.LOCATION) } : {},
            ...current.DESCRIPTION !== void 0 ? { note: unescapeText(current.DESCRIPTION) } : {},
            ...current.RRULE !== void 0 ? { repeat: fromRrule(current.RRULE) } : {},
            remindBefore: [],
            source: "import"
          });
        }
      }
      current = null;
      continue;
    }
    if (current === null) continue;
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const key = line.slice(0, colon).split(";")[0]?.toUpperCase() ?? "";
    const value = line.slice(colon + 1);
    if (key !== "") current[key] = value;
  }
  return { events, skipped };
}

// src/notify.ts
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

// src/repeat.ts
var LIMIT = 500;
function parseStamp(value) {
  const date = value.slice(0, 10);
  const time = value.length >= 16 ? value.slice(11, 16) : "00:00";
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0);
}
function stamp(date) {
  const pad2 = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}
function iso(date) {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}
function midnight(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function weekStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - (iso(date) - 1));
}
function weekdaysOf(repeat, fallback) {
  const list = repeat.weekdays?.filter((d) => d >= 1 && d <= 7) ?? [];
  return list.length > 0 ? list : [fallback];
}
function expandEvent(event, from, to) {
  const start = parseStamp(event.start);
  const end = parseStamp(event.end);
  const duration = Math.max(0, end.getTime() - start.getTime());
  const repeat = event.repeat ?? { kind: "none" };
  const until = repeat.until !== void 0 ? parseStamp(`${repeat.until}T23:59`) : null;
  const out = [];
  const push = (occurrenceStart) => {
    if (out.length >= LIMIT) return;
    const occurrenceEnd = new Date(occurrenceStart.getTime() + duration);
    if (occurrenceStart >= to || occurrenceEnd < from) return;
    out.push({ key: `${event.id}@${stamp(occurrenceStart)}`, event, start: occurrenceStart, end: occurrenceEnd });
  };
  if (repeat.kind === "none") {
    push(start);
    return out;
  }
  const firstDay = midnight(start);
  const cursor = midnight(from) < firstDay ? firstDay : midnight(from);
  const last = new Date(to);
  let guard = 0;
  for (let day = new Date(cursor); day < last && guard < 2e3; day.setDate(day.getDate() + 1), guard += 1) {
    if (until !== null && day > until) break;
    const candidate = new Date(day);
    candidate.setHours(start.getHours(), start.getMinutes(), 0, 0);
    switch (repeat.kind) {
      case "daily":
        push(candidate);
        break;
      case "weekdays":
        if (iso(day) >= 1 && iso(day) <= 5) push(candidate);
        break;
      case "weekly":
        if (weekdaysOf(repeat, iso(firstDay)).includes(iso(day))) push(candidate);
        break;
      case "biweekly": {
        if (!weekdaysOf(repeat, iso(firstDay)).includes(iso(day))) break;
        const weeks = Math.round((weekStart(day).getTime() - weekStart(firstDay).getTime()) / (7 * 864e5));
        if (weeks % 2 === 0) push(candidate);
        break;
      }
      case "monthly":
        if (day.getDate() === firstDay.getDate()) push(candidate);
        break;
      default:
        break;
    }
  }
  return out;
}
function expandAll(events, from, to) {
  const out = [];
  for (const event of events) out.push(...expandEvent(event, from, to));
  out.sort((a, b) => a.start.getTime() - b.start.getTime());
  return out;
}

// src/notify.ts
var TICK_MS = 15e3;
var MAX_AGE_MS = 30 * 6e4;
var LOOKBACK_MS = 12 * 60 * 6e4;
var MAX_MISSED = 5;
var MAX_FIRED = 4e3;
function inQuietHours(state, date) {
  const quiet = state.settings.quietHours;
  if (!quiet.enabled) return false;
  const minutes = date.getHours() * 60 + date.getMinutes();
  const parse = (value) => {
    const [h, m] = value.split(":").map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };
  const from = parse(quiet.from);
  const to = parse(quiet.to);
  if (from === to) return false;
  return from < to ? minutes >= from && minutes < to : minutes >= from || minutes < to;
}
var ReminderEngine = class {
  options;
  fired = /* @__PURE__ */ new Map();
  queue = /* @__PURE__ */ new Map();
  deliveredAt = /* @__PURE__ */ new Map();
  timer;
  lastScan = 0;
  firstScanDone = false;
  constructor(options) {
    this.options = options;
    this.load();
  }
  /** Read the fired log, ignoring and resetting a damaged file. */
  load() {
    const path = this.options.logPath;
    if (!existsSync(path)) return;
    try {
      const parsed = JSON.parse(readFileSync(path, "utf8"));
      for (const [key, at] of Object.entries(parsed.fired ?? {})) {
        if (typeof at === "number") this.fired.set(key, at);
      }
    } catch (error) {
      this.options.onError?.(error);
    }
  }
  /** Persist the fired log atomically, dropping entries past the retention window. */
  save() {
    const path = this.options.logPath;
    const cutoff = this.now() - 40 * 24 * 60 * 6e4;
    const entries = [...this.fired.entries()].filter(([, at]) => at >= cutoff).slice(-MAX_FIRED);
    this.fired.clear();
    for (const [key, at] of entries) this.fired.set(key, at);
    const payload = { fired: Object.fromEntries(entries) };
    try {
      mkdirSync(dirname(path), { recursive: true });
      const tmp = `${path}.tmp`;
      writeFileSync(tmp, `${JSON.stringify(payload, null, 2)}
`, "utf8");
      renameSync(tmp, path);
    } catch (error) {
      this.options.onError?.(error);
    }
  }
  /** Current time in epoch milliseconds. */
  now() {
    return this.options.now?.() ?? Date.now();
  }
  /** Start the scan loop. @returns a disposer. */
  start() {
    this.scan();
    this.timer = setInterval(() => this.scan(), TICK_MS);
    if (typeof this.timer.unref === "function") this.timer.unref();
    return () => this.stop();
  }
  /** Stop the scan loop. */
  stop() {
    if (this.timer !== void 0) clearInterval(this.timer);
    this.timer = void 0;
  }
  /**
   * Drop queue entries that are too old to be useful.
   * @param now - current epoch ms.
   */
  prune(now) {
    for (const [id, notice] of this.queue) {
      const delivered = this.deliveredAt.get(id);
      if (delivered !== void 0 && now - delivered > MAX_AGE_MS) {
        this.queue.delete(id);
        this.deliveredAt.delete(id);
        continue;
      }
      if (delivered === void 0 && now - notice.firedAt > MAX_AGE_MS) this.queue.delete(id);
    }
  }
  /**
   * One scan pass: queue every lead time that just arrived.
   * @returns the notices queued by this pass.
   */
  scan() {
    const state = this.options.state();
    const now = this.now();
    const from = this.lastScan === 0 ? now - LOOKBACK_MS : this.lastScan - 1e3;
    this.lastScan = now;
    this.prune(now);
    const occurrences = expandAll(state.events, new Date(from - 24 * 60 * 6e4), new Date(now + 60 * 6e4));
    const added = [];
    let recorded = false;
    for (const occurrence of occurrences) {
      const event = occurrence.event;
      const leads = (event.remindBefore ?? []).filter((lead) => Number.isFinite(lead) && lead >= 0);
      for (const lead of leads) {
        const fireAt = occurrence.start.getTime() - lead * 6e4;
        if (fireAt > now || fireAt < from) continue;
        const id = `${occurrence.key}#${lead}`;
        if (this.fired.has(id) || this.queue.has(id)) continue;
        const missed = !this.firstScanDone && now - fireAt > 2 * 6e4;
        if (missed && added.length >= MAX_MISSED) continue;
        if (!missed && inQuietHours(state, new Date(fireAt))) {
          this.fired.set(id, fireAt);
          recorded = true;
          continue;
        }
        const notice = {
          id,
          eventId: event.id,
          title: event.title,
          start: event.start,
          end: event.end,
          allDay: event.allDay,
          location: event.location,
          leadMinutes: lead,
          firedAt: fireAt,
          ...missed ? { missed: true } : {}
        };
        this.queue.set(id, notice);
        this.fired.set(id, fireAt);
        added.push(notice);
      }
    }
    this.firstScanDone = true;
    if (added.length > 0 || recorded) this.save();
    return added;
  }
  /**
   * Take every notice the browser has not seen yet.
   * @returns notices to render now.
   */
  pending() {
    const now = this.now();
    this.prune(now);
    const out = [];
    for (const [id, notice] of this.queue) {
      if (this.deliveredAt.has(id)) continue;
      if (notice.snoozedUntil !== void 0 && notice.snoozedUntil > now) continue;
      this.deliveredAt.set(id, now);
      out.push(notice);
    }
    return out;
  }
  /**
   * Re-arm one notice after a snooze.
   * @param id - notice id.
   * @param minutes - delay in minutes.
   * @returns the updated notice, or undefined when it is gone.
   */
  snooze(id, minutes) {
    const notice = this.queue.get(id);
    if (notice === void 0) return void 0;
    notice.snoozedUntil = this.now() + Math.max(1, minutes) * 6e4;
    this.deliveredAt.delete(id);
    return notice;
  }
  /**
   * Forget one notice: the user closed or completed it.
   * @param id - notice id.
   */
  ack(id) {
    this.queue.delete(id);
    this.deliveredAt.delete(id);
  }
  /** Everything still on screen, for diagnostics and tests. */
  snapshot() {
    return [...this.queue.values()];
  }
};

// src/tool-schema.ts
var ANNOTATIONS = ["description", "title", "default", "examples"];
function fail(path, message) {
  throw new Error(`tool schema ${path}: ${message}`);
}
function compileValue(spec, path, allowRequired) {
  if (spec === null || typeof spec !== "object") fail(path, "must be a schema object");
  const node = {};
  const allowed = /* @__PURE__ */ new Set([...ANNOTATIONS, "type", "oneOf"]);
  if (allowRequired) allowed.add("required");
  for (const key of Object.keys(spec)) {
    if (key === "items" || key === "properties" || key === "additionalProperties" || key === "enum" || key === "const") continue;
    if (!allowed.has(key)) fail(`${path}.${key}`, "is not part of the tool schema DSL");
  }
  if (spec.required !== void 0 && spec.required !== true) fail(`${path}.required`, "must be true when present");
  for (const key of ANNOTATIONS) {
    const value = spec[key];
    if (value !== void 0) node[key] = value;
  }
  if (spec.oneOf !== void 0) {
    if (spec.type !== void 0) fail(path, "cannot declare both type and oneOf");
    if (!Array.isArray(spec.oneOf) || spec.oneOf.length < 2) fail(`${path}.oneOf`, "must list at least two schemas");
    node.oneOf = spec.oneOf.map((branch, index) => compileValue(branch, `${path}.oneOf[${index}]`, false));
    return node;
  }
  switch (spec.type) {
    case "object": {
      if (typeof spec.additionalProperties !== "boolean") {
        fail(`${path}.additionalProperties`, "must be true or false");
      }
      node.type = "object";
      node.additionalProperties = spec.additionalProperties;
      if (spec.properties !== void 0) {
        const compiled = compileProperties(spec.properties, `${path}.properties`);
        node.properties = compiled.properties;
        if (compiled.required.length > 0) node.required = compiled.required;
      }
      return node;
    }
    case "array": {
      node.type = "array";
      if (spec.items !== void 0) node.items = compileValue(spec.items, `${path}.items`, false);
      return node;
    }
    case "string":
    case "number":
    case "integer":
    case "boolean":
    case "null": {
      node.type = spec.type;
      if (spec.enum !== void 0) {
        if (!Array.isArray(spec.enum) || spec.enum.length === 0) fail(`${path}.enum`, "must be a non-empty array");
        node.enum = [...spec.enum];
      }
      if (spec.const !== void 0) node.const = spec.const;
      return node;
    }
    case "json":
      return node;
    default:
      return fail(`${path}.type`, "must be string/number/integer/boolean/null/array/object/json, or use oneOf");
  }
}
function compileProperties(properties, path) {
  const out = {};
  const required = [];
  for (const [key, spec] of Object.entries(properties)) {
    if (spec === null || typeof spec !== "object") fail(`${path}.${key}`, "must be a schema object");
    out[key] = compileValue(spec, `${path}.${key}`, true);
    if (spec.required === true) required.push(key);
  }
  return { properties: out, required };
}
function parametersToSchema(parameters) {
  const { properties, required } = compileProperties(parameters, "parameters");
  return {
    type: "object",
    properties,
    ...required.length > 0 ? { required } : {}
  };
}
function outputToSchema(schema) {
  return compileValue(schema, "schema", false);
}
function validateRawSchema(schema) {
  const violations = [];
  const walk = (node, path) => {
    if (node === null || typeof node !== "object" || Array.isArray(node)) {
      violations.push(`${path} must be a schema object`);
      return;
    }
    const record = node;
    for (const key of Object.keys(record)) {
      if (!["type", "oneOf", "properties", "required", "additionalProperties", "items", "enum", "const", ...ANNOTATIONS].includes(key)) {
        violations.push(`${path}.${key} is not a supported keyword`);
      }
    }
    if (record.type !== void 0 && record.oneOf !== void 0) violations.push(`${path} cannot declare both type and oneOf`);
    if (record.oneOf !== void 0) {
      if (!Array.isArray(record.oneOf) || record.oneOf.length < 2) violations.push(`${path}.oneOf must list at least two schemas`);
      else record.oneOf.forEach((branch, index) => walk(branch, `${path}.oneOf[${index}]`));
    }
    if (record.type === "object") {
      if (record.additionalProperties !== void 0 && typeof record.additionalProperties !== "boolean") {
        violations.push(`${path}.additionalProperties must be a boolean`);
      }
      const properties = record.properties;
      if (properties !== void 0) {
        if (properties === null || typeof properties !== "object" || Array.isArray(properties)) {
          violations.push(`${path}.properties must be an object`);
        } else {
          for (const [key, value] of Object.entries(properties)) walk(value, `${path}.properties.${key}`);
        }
      }
      if (record.required !== void 0) {
        const required = record.required;
        if (!Array.isArray(required) || required.some((name2) => typeof name2 !== "string")) {
          violations.push(`${path}.required must be an array of strings`);
        } else if (properties !== void 0 && record.properties !== null && typeof record.properties === "object") {
          const declared = record.properties;
          for (const name2 of required) {
            if (!(name2 in declared)) violations.push(`${path}.required names "${String(name2)}", which is not declared`);
          }
        }
      }
    }
    if (record.type === "array" && record.items !== void 0) walk(record.items, `${path}.items`);
  };
  walk(schema, "schema");
  return violations;
}

// src/tools.ts
var ADD_TOOL = "calendar_add";
var LIST_TOOL = "calendar_list";
var DELETE_TOOL = "calendar_delete";
var EVENT_PARAMETERS = {
  title: { type: "string", required: true, description: 'Short event title, without a leading command such as "remind me to".' },
  start: { type: "string", required: true, description: 'Local start, exactly "YYYY-MM-DDTHH:mm".' },
  end: { type: "string", description: 'Local end, "YYYY-MM-DDTHH:mm". Defaults to one hour after the start.' },
  allDay: { type: "boolean", description: "True for an all-day event." },
  location: { type: "string", description: "Place, optional." },
  note: { type: "string", description: "Free-form note, optional." },
  remindBefore: {
    type: "array",
    items: { type: "number", description: "Minutes before the start." },
    description: "Lead times in minutes. `[10]` means remind ten minutes before the start."
  },
  repeat: {
    type: "object",
    additionalProperties: false,
    description: "Recurrence. Omit for a single event.",
    properties: {
      kind: {
        type: "string",
        required: true,
        enum: ["none", "daily", "weekly", "monthly", "weekdays", "biweekly"],
        description: "`weekdays` is Monday through Friday."
      },
      weekdays: {
        type: "array",
        items: { type: "integer", description: "ISO weekday, 1=Monday \u2026 7=Sunday." },
        description: "Required for `weekly` and `biweekly`."
      },
      until: { type: "string", description: 'Last day the repeat may produce, "YYYY-MM-DD".' }
    }
  }
};
var ADD_OUTPUT = {
  type: "object",
  additionalProperties: false,
  properties: {
    created: {
      type: "array",
      required: true,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string", required: true },
          title: { type: "string", required: true },
          start: { type: "string", required: true },
          end: { type: "string", required: true }
        }
      }
    }
  }
};
var LIST_OUTPUT = {
  type: "object",
  additionalProperties: false,
  properties: {
    events: {
      type: "array",
      required: true,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string", required: true },
          title: { type: "string", required: true },
          start: { type: "string", required: true },
          end: { type: "string", required: true },
          location: { type: "string" }
        }
      }
    }
  }
};
var DELETE_OUTPUT = {
  type: "object",
  additionalProperties: false,
  properties: {
    deleted: {
      type: "array",
      required: true,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string", required: true },
          title: { type: "string", required: true },
          start: { type: "string", required: true },
          end: { type: "string", required: true }
        }
      }
    }
  }
};
function human(stamp2) {
  return stamp2.replace("T", " ");
}
function calendarToolDefinitions(handlers) {
  const addParameters = parametersToSchema({
    events: {
      type: "array",
      required: true,
      items: { type: "object", additionalProperties: false, properties: EVENT_PARAMETERS },
      description: "Events to create."
    }
  });
  const addSchema = outputToSchema(ADD_OUTPUT);
  const listParameters = parametersToSchema({
    from: { type: "string", required: true, description: 'First day, "YYYY-MM-DD", inclusive. Use today for "upcoming" questions.' },
    to: { type: "string", required: true, description: 'Last day, "YYYY-MM-DD", inclusive. About 30 days ahead covers "what is coming up".' }
  });
  const listSchema = outputToSchema(LIST_OUTPUT);
  const deleteParameters = parametersToSchema({
    ids: {
      type: "array",
      required: true,
      items: { type: "string", description: "An id returned by calendar_list." },
      description: "Events to delete. The whole stored event goes, including every occurrence of a repeating one."
    }
  });
  const deleteSchema = outputToSchema(DELETE_OUTPUT);
  for (const [label, schema] of [
    ["calendar_add.parameters", addParameters],
    ["calendar_add.output", addSchema],
    ["calendar_list.parameters", listParameters],
    ["calendar_list.output", listSchema],
    ["calendar_delete.parameters", deleteParameters],
    ["calendar_delete.output", deleteSchema]
  ]) {
    const violations = validateRawSchema(schema);
    if (violations.length > 0) throw new Error(`${label}: ${violations.join("; ")}`);
  }
  return [
    {
      name: ADD_TOOL,
      description: `Add one or more events to the user's DSH calendar. Call it only after the user has agreed to the events in conversation; every call also pauses for an explicit approval before anything is written. Times are local wall-clock "YYYY-MM-DDTHH:mm"; resolve "tomorrow", "next Wednesday" and similar against the current date before calling.`,
      parameters: addParameters,
      output: {
        schema: addSchema,
        render: (_args, value) => [
          {
            type: "text",
            text: value.created.length === 0 ? "No event was created." : value.created.map((event) => `Added: ${event.title} \u2014 ${human(event.start)} to ${human(event.end)}`).join("\n")
          }
        ]
      },
      execute: (args) => {
        if (args === null || typeof args !== "object" || !Array.isArray(args.events)) {
          throw new Error("events must be an array of event objects");
        }
        const parsed = [];
        for (const [index, row] of args.events.entries()) {
          const event = normalizeEventRow(row);
          if (event === null) throw new Error(`events[${index}] needs at least a title and a start of the form YYYY-MM-DDTHH:mm`);
          parsed.push(event);
        }
        return { created: handlers.add(parsed) };
      },
      isConcurrencySafe: () => false
    },
    {
      name: LIST_TOOL,
      description: `List the user's calendar events between two local dates, inclusive, with every occurrence of repeating events. Call it whenever the answer depends on what the user already has scheduled \u2014 "what is coming up", "what's on next week", "am I free on Thursday", or any question about their plans \u2014 instead of answering from memory. It is also the only way to obtain the ids that calendar_delete needs.`,
      parameters: listParameters,
      output: {
        schema: listSchema,
        render: (_args, value) => [
          {
            type: "text",
            text: value.events.length === 0 ? "No events in that range." : value.events.map((event) => `${human(event.start)} ${event.title}${event.location === void 0 ? "" : ` @ ${event.location}`} [id: ${event.id}]`).join("\n")
          }
        ]
      },
      execute: (args) => {
        const from = typeof args?.from === "string" ? args.from : "";
        const to = typeof args?.to === "string" ? args.to : "";
        if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
          throw new Error("from and to must be dates of the form YYYY-MM-DD");
        }
        return { events: handlers.list(from, to) };
      },
      isConcurrencySafe: () => true
    },
    {
      name: DELETE_TOOL,
      description: "Delete events from the user's DSH calendar by id. Call calendar_list first and copy its ids; never guess one. Deleting removes the whole stored event \u2014 for a repeating event that means every occurrence \u2014 and cannot be undone, so confirm the titles with the user before calling; every call also pauses for an explicit approval.",
      parameters: deleteParameters,
      output: {
        schema: deleteSchema,
        render: (_args, value) => [
          {
            type: "text",
            text: value.deleted.length === 0 ? "Nothing was deleted." : value.deleted.map((event) => `Deleted: ${event.title} \u2014 ${human(event.start)}`).join("\n")
          }
        ]
      },
      execute: (args) => {
        if (args === null || typeof args !== "object" || !Array.isArray(args.ids) || args.ids.length === 0) {
          throw new Error("ids must be a non-empty array of event ids from calendar_list");
        }
        const ids = args.ids.map((id) => String(id)).filter((id) => id !== "");
        if (ids.length === 0) throw new Error("ids must be a non-empty array of event ids from calendar_list");
        return { deleted: handlers.remove(ids) };
      },
      isConcurrencySafe: () => false
    }
  ];
}
function registerCalendarTools(ctx, handlers) {
  if (typeof ctx.inject !== "function") return;
  try {
    ctx.inject(["tools"], (scope) => {
      const tools = scope.tools;
      if (tools === void 0 || typeof tools.register !== "function") return;
      const names = [];
      for (const definition of calendarToolDefinitions(handlers)) {
        try {
          tools.register(definition);
          names.push(definition.name);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          ctx.logger?.error?.(`[dsh-schedule-calendar] tool registration failed: ${message}`);
        }
      }
      if (names.length > 0) {
        ctx.logger?.info?.(`[dsh-schedule-calendar] tools registered: ${names.join(", ")}`);
      }
    });
  } catch (error) {
    ctx.logger?.warn("[dsh-schedule-calendar] no tool registry in this composition:", error);
  }
}
function summarizeAdd(args) {
  const events = args?.events;
  if (!Array.isArray(events) || events.length === 0) return null;
  const lines = [];
  for (const row of events.slice(0, 5)) {
    const event = row;
    const title = typeof event.title === "string" && event.title.trim() !== "" ? event.title.trim() : "(untitled)";
    const start = typeof event.start === "string" ? human(event.start) : "?";
    const end = typeof event.end === "string" ? `\u2013${human(event.end).slice(11)}` : "";
    lines.push(`\xB7 ${title} \u2014 ${start}${end}`);
  }
  if (events.length > 5) lines.push(`\xB7 \u2026${events.length - 5} more`);
  return { count: events.length, lines };
}
function summarizeDelete(args, lookup) {
  const ids = args?.ids;
  if (!Array.isArray(ids) || ids.length === 0) return null;
  const known = lookup?.(ids.map((id) => String(id))) ?? [];
  if (known.length === 0) {
    return { count: ids.length, lines: ids.slice(0, 5).map((id) => `\xB7 ${String(id)}`) };
  }
  const lines = known.slice(0, 5).map((event) => `\xB7 ${event.title} \u2014 ${human(event.start)}`);
  if (known.length > 5) lines.push(`\xB7 \u2026${known.length - 5} more`);
  return { count: known.length, lines };
}
function installApprovalGate(ctx, options = {}) {
  if (typeof ctx.on !== "function") return;
  try {
    ctx.on("tools/pre-execute", ((exec, next) => {
      const name2 = exec?.name;
      if (name2 !== ADD_TOOL && name2 !== DELETE_TOOL) return next();
      const deleting = name2 === DELETE_TOOL;
      const summary = deleting ? summarizeDelete(exec.arguments, options.lookup) : summarizeAdd(exec.arguments);
      const label = deleting ? "\u5220\u9664\u65E5\u7A0B / Delete from calendar" : "\u5199\u5165\u65E5\u7A0B / Add to calendar";
      const verb = deleting ? "Delete" : "Add";
      return {
        kind: "ask",
        reason: summary === null ? `${verb} events in the DSH calendar` : `${verb} ${summary.count} event(s) in the DSH calendar:
${summary.lines.join("\n")}`,
        displayReason: summary === null ? label : `${label} (${summary.count}):
${summary.lines.join("\n")}`
      };
    }));
  } catch (error) {
    ctx.logger?.warn("[dsh-schedule-calendar] approval gate not installed:", error);
  }
}

// src/store.ts
import { existsSync as existsSync2, mkdirSync as mkdirSync2, readFileSync as readFileSync2, renameSync as renameSync2, writeFileSync as writeFileSync2, copyFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname as dirname2, join } from "node:path";
var DEFAULT_PERIODS = [
  { index: 1, start: "08:00", end: "08:45" },
  { index: 2, start: "08:55", end: "09:40" },
  { index: 3, start: "10:00", end: "10:45" },
  { index: 4, start: "10:55", end: "11:40" },
  { index: 5, start: "14:00", end: "14:45" },
  { index: 6, start: "14:55", end: "15:40" },
  { index: 7, start: "16:00", end: "16:45" },
  { index: 8, start: "16:55", end: "17:40" },
  { index: 9, start: "19:00", end: "19:45" },
  { index: 10, start: "19:55", end: "20:40" },
  { index: 11, start: "20:50", end: "21:35" },
  { index: 12, start: "21:45", end: "22:30" }
];
var DEFAULT_SETTINGS = {
  timetableEnabled: false,
  defaultRemindBefore: 10,
  quietHours: { enabled: false, from: "23:00", to: "07:00" },
  soundEnabled: true,
  systemNotification: true,
  weekStart: 1,
  timeFormat: "24h"
};
function mondayOf(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay() === 0 ? 7 : d.getDay();
  d.setDate(d.getDate() - (day - 1));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function pad(value) {
  return String(value).padStart(2, "0");
}
function defaultTerm() {
  return {
    startDate: mondayOf(/* @__PURE__ */ new Date()),
    totalWeeks: 20,
    days: [1, 2, 3, 4, 5, 6, 7],
    periods: DEFAULT_PERIODS.map((p) => ({ ...p }))
  };
}
function emptyState() {
  return {
    version: 1,
    term: defaultTerm(),
    events: [],
    courses: [],
    plans: [],
    settings: { ...DEFAULT_SETTINGS, quietHours: { ...DEFAULT_SETTINGS.quietHours } }
  };
}
function dataDir(env = process.env) {
  const home = env.DSH_HOME && env.DSH_HOME.trim() !== "" ? env.DSH_HOME : join(homedir(), ".dsh");
  return join(home, "storages", "dsh-schedule-calendar");
}
function dataFile(env = process.env) {
  return join(dataDir(env), "calendar.json");
}
function normalize(raw) {
  const base = emptyState();
  if (raw === null || typeof raw !== "object") return base;
  const doc = raw;
  const term = { ...base.term };
  if (doc.term && typeof doc.term === "object") {
    const t = doc.term;
    if (typeof t.startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(t.startDate)) term.startDate = t.startDate;
    if (typeof t.totalWeeks === "number" && t.totalWeeks > 0) term.totalWeeks = Math.min(60, Math.round(t.totalWeeks));
    if (Array.isArray(t.days) && t.days.length > 0) term.days = t.days.filter((d) => typeof d === "number" && d >= 1 && d <= 7);
    if (Array.isArray(t.periods) && t.periods.length > 0) {
      term.periods = t.periods.filter((p) => p && typeof p.index === "number").map((p) => ({ index: p.index, start: String(p.start ?? "08:00"), end: String(p.end ?? "08:45") }));
    }
  }
  const settings = { ...base.settings, ...typeof doc.settings === "object" && doc.settings !== null ? doc.settings : {} };
  settings.quietHours = { ...base.settings.quietHours, ...settings.quietHours ?? {} };
  return {
    version: 1,
    term,
    events: Array.isArray(doc.events) ? doc.events.filter((e) => e && typeof e.id === "string") : [],
    courses: Array.isArray(doc.courses) ? doc.courses.filter((c) => c && typeof c.id === "string") : [],
    plans: Array.isArray(doc.plans) ? doc.plans.filter((p) => p && typeof p.id === "string") : [],
    settings
  };
}
function openStore(env = process.env, onError) {
  const file = dataFile(env);
  const dir = dirname2(file);
  if (!existsSync2(dir)) mkdirSync2(dir, { recursive: true });
  let state = emptyState();
  if (existsSync2(file)) {
    try {
      state = normalize(JSON.parse(readFileSync2(file, "utf8")));
    } catch (error) {
      const backup = `${file}.broken-${Date.now()}`;
      try {
        copyFileSync(file, backup);
      } catch {
      }
      onError?.(error);
    }
  }
  let timer;
  let dirty = false;
  let revision = 0;
  const flush = () => {
    if (timer !== void 0) {
      clearTimeout(timer);
      timer = void 0;
    }
    if (!dirty) return;
    dirty = false;
    const tmp = `${file}.tmp-${process.pid}`;
    try {
      mkdirSync2(dir, { recursive: true });
      writeFileSync2(tmp, `${JSON.stringify(state, null, 2)}
`, "utf8");
      renameSync2(tmp, file);
    } catch (error) {
      dirty = true;
      onError?.(error);
    }
  };
  const save = () => {
    dirty = true;
    if (timer !== void 0) return;
    timer = setTimeout(() => {
      timer = void 0;
      flush();
    }, 150);
    if (typeof timer.unref === "function") timer.unref();
  };
  return {
    get state() {
      return state;
    },
    update(mutator) {
      const result = mutator(state);
      revision += 1;
      save();
      return result;
    },
    get revision() {
      return revision;
    },
    flush,
    path: file
  };
}

// src/index.ts
var name = "dsh-schedule-calendar";
var inject = ["webServer"];
var ROUTE = "/api/dsh-calendar";
function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(body);
}
async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = chunk;
    size += buf.length;
    if (size > 4 * 1024 * 1024) throw new Error("payload too large");
    chunks.push(buf);
  }
  if (size === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
var InputError = class extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.code = code;
  }
};
var STAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
function requireStamp(value, field) {
  if (typeof value !== "string" || !STAMP.test(value)) throw new InputError("invalid-time", `${field} must look like 2026-11-04T15:30`);
  return value;
}
function cleanRepeat(input) {
  const raw = input ?? {};
  const kind = raw.kind;
  if (kind === void 0 || kind === "none") return { kind: "none" };
  if (!["daily", "weekly", "monthly", "weekdays", "biweekly"].includes(String(kind))) {
    throw new InputError("invalid-repeat", `unknown repeat kind: ${String(kind)}`);
  }
  const repeat = { kind };
  if (Array.isArray(raw.weekdays)) {
    const days = [...new Set(raw.weekdays.filter((d) => Number.isInteger(d) && d >= 1 && d <= 7))].sort((a, b) => a - b);
    if (days.length > 0) repeat.weekdays = days;
  }
  if (typeof raw.until === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.until)) repeat.until = raw.until;
  return repeat;
}
function cleanEvent(input, existing) {
  const raw = input ?? {};
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (title === "") throw new InputError("invalid-title", "an event needs a title");
  if (title.length > 200) throw new InputError("invalid-title", "the title is too long");
  const start = requireStamp(raw.start, "start");
  const end = requireStamp(raw.end ?? raw.start, "end");
  if (end < start) throw new InputError("invalid-time", "the end must not be before the start");
  const now = Date.now();
  const remindBefore = Array.isArray(raw.remindBefore) ? [...new Set(raw.remindBefore.filter((m) => Number.isFinite(m) && m >= 0 && m <= 60 * 24 * 30))].sort((a, b) => a - b) : [];
  return {
    id: existing?.id ?? (typeof raw.id === "string" && raw.id !== "" ? raw.id : randomUUID()),
    title,
    start,
    end,
    allDay: raw.allDay === true,
    location: typeof raw.location === "string" ? raw.location.slice(0, 200) : void 0,
    note: typeof raw.note === "string" ? raw.note.slice(0, 2e3) : void 0,
    color: typeof raw.color === "string" ? raw.color.slice(0, 24) : void 0,
    remindBefore,
    repeat: cleanRepeat(raw.repeat),
    done: raw.done === true,
    source: existing?.source ?? (raw.source === "ai" || raw.source === "import" || raw.source === "course" ? raw.source : "manual"),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
}
function cleanPlan(input, existing) {
  const raw = input ?? {};
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (title === "") throw new InputError("invalid-title", "a plan needs a title");
  const id = typeof raw.id === "string" && raw.id !== "" ? raw.id : randomUUID();
  const previous = existing.find((plan) => plan.id === id);
  const now = Date.now();
  const milestones = (Array.isArray(raw.milestones) ? raw.milestones : []).map((item) => {
    const milestone = item;
    const milestoneTitle = typeof milestone.title === "string" ? milestone.title.trim() : "";
    if (milestoneTitle === "") throw new InputError("invalid-milestone", "a milestone needs a title");
    return {
      id: typeof milestone.id === "string" && milestone.id !== "" ? milestone.id : randomUUID(),
      title: milestoneTitle.slice(0, 200),
      due: typeof milestone.due === "string" && /^\d{4}-\d{2}-\d{2}$/.test(milestone.due) ? milestone.due : void 0,
      done: milestone.done === true,
      note: typeof milestone.note === "string" ? milestone.note.slice(0, 500) : void 0
    };
  });
  const allDone = milestones.length > 0 && milestones.every((milestone) => milestone.done);
  return {
    id,
    title: title.slice(0, 200),
    goal: typeof raw.goal === "string" ? raw.goal.slice(0, 2e3) : void 0,
    due: typeof raw.due === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.due) ? raw.due : void 0,
    priority: raw.priority === "low" || raw.priority === "high" ? raw.priority : "normal",
    milestones,
    status: allDone ? "done" : raw.status === "paused" ? "paused" : "active",
    createdAt: previous?.createdAt ?? now,
    updatedAt: now
  };
}
function cleanCourse(input, existing) {
  const raw = input ?? {};
  const name2 = typeof raw.name === "string" ? raw.name.trim() : "";
  if (name2 === "") throw new InputError("invalid-name", "a course needs a name");
  const weekday = Number(raw.weekday);
  if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) throw new InputError("invalid-weekday", "weekday must be 1 to 7");
  const periods = Array.isArray(raw.periods) ? [...new Set(raw.periods.map((p) => Number(p)).filter((p) => Number.isInteger(p) && p >= 1 && p <= 24))].sort((a, b) => a - b) : [];
  if (periods.length === 0) throw new InputError("invalid-periods", "a course needs at least one period");
  const weeks = raw.weeks ?? { from: 1, to: 20 };
  const from = Number(weeks.from);
  const to = Number(weeks.to);
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from) {
    throw new InputError("invalid-weeks", "the week range must be positive and ordered");
  }
  const parityRaw = raw.parity;
  const parity = parityRaw === "odd" || parityRaw === "even" ? parityRaw : "all";
  const now = Date.now();
  return {
    id: existing?.id ?? (typeof raw.id === "string" && raw.id !== "" ? raw.id : randomUUID()),
    name: name2,
    teacher: typeof raw.teacher === "string" && raw.teacher.trim() !== "" ? raw.teacher.trim().slice(0, 100) : void 0,
    location: typeof raw.location === "string" && raw.location.trim() !== "" ? raw.location.trim().slice(0, 100) : void 0,
    weekday,
    periods,
    weeks: { from, to: Math.min(60, to) },
    parity,
    color: typeof raw.color === "string" ? raw.color.slice(0, 24) : void 0,
    note: typeof raw.note === "string" ? raw.note.slice(0, 500) : void 0,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
}
function createRouter(store, engine, context) {
  const findEvent = (id) => {
    if (typeof id !== "string") throw new InputError("invalid-id", "missing event id");
    const found = store.state.events.find((event) => event.id === id);
    if (found === void 0) throw new InputError("not-found", "that event no longer exists");
    return found;
  };
  return {
    /** Whole document, for the first paint and after a reload. */
    "state.get": () => store.state,
    /** Cheap change stamp: the page polls it so a write from chat reaches the panel. */
    "state.rev": () => ({ revision: store.revision }),
    /** Liveness probe used by the browser half's error state. */
    ping: () => ({ ok: true, path: store.path }),
    /** Create or replace one event; answers the whole document. */
    "event.save": (body) => store.update((state) => {
      const raw = body?.event ?? {};
      const existing = typeof raw.id === "string" ? state.events.find((event2) => event2.id === raw.id) : void 0;
      const event = cleanEvent(raw, existing);
      const index = state.events.findIndex((candidate) => candidate.id === event.id);
      if (index >= 0) state.events[index] = event;
      else state.events.push(event);
      return state;
    }),
    /** Remove one event. */
    "event.delete": (body) => store.update((state) => {
      const event = findEvent(body?.id);
      state.events = state.events.filter((candidate) => candidate.id !== event.id);
      return state;
    }),
    /** Tick or untick one event. */
    "event.setDone": (body) => store.update((state) => {
      const event = findEvent(body?.id);
      event.done = body?.done === true;
      event.updatedAt = Date.now();
      return state;
    }),
    /** Merge a settings patch. */
    "settings.update": (body) => store.update((state) => {
      const patch = body?.patch ?? {};
      const next = { ...state.settings, ...patch };
      next.quietHours = { ...state.settings.quietHours, ...patch.quietHours ?? {} };
      state.settings = next;
      return state;
    }),
    /** Replace the term configuration. */
    "term.update": (body) => store.update((state) => {
      const term = body?.term ?? {};
      if (typeof term.startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(term.startDate)) state.term.startDate = term.startDate;
      if (Number.isInteger(term.totalWeeks) && term.totalWeeks > 0) {
        state.term.totalWeeks = Math.min(60, term.totalWeeks);
      }
      if (Array.isArray(term.days) && term.days.length > 0) {
        state.term.days = term.days.filter((d) => Number.isInteger(d) && d >= 1 && d <= 7);
      }
      if (Array.isArray(term.periods) && term.periods.length > 0) {
        state.term.periods = term.periods.filter((p) => p && Number.isInteger(p.index)).map((p) => ({ index: p.index, start: String(p.start ?? "08:00"), end: String(p.end ?? "08:45") })).sort((a, b) => a.index - b.index);
      }
      return state;
    }),
    /** Drain the reminders that are due; the page renders them and calls back. */
    "notify.pending": () => engine.pending(),
    /** Snooze one reminder. */
    "notify.snooze": (body) => {
      if (typeof body?.id !== "string") throw new InputError("invalid-id", "missing notice id");
      const minutes = Number(body?.minutes ?? 5);
      return { ok: engine.snooze(body.id, Number.isFinite(minutes) ? minutes : 5) !== void 0 };
    },
    /** Dismiss one reminder for good. */
    "notify.ack": (body) => {
      if (typeof body?.id !== "string") throw new InputError("invalid-id", "missing notice id");
      engine.ack(body.id);
      return { ok: true };
    },
    /** Tick an event straight from its reminder, without opening the editor. */
    "notify.complete": (body) => store.update((state) => {
      const event = findEvent(body?.eventId);
      event.done = true;
      event.updatedAt = Date.now();
      return state;
    }),
    /** Create or replace one timetable course. */
    "course.save": (body) => store.update((state) => {
      const raw = body?.course ?? {};
      const existing = typeof raw.id === "string" ? state.courses.find((course2) => course2.id === raw.id) : void 0;
      const course = cleanCourse(raw, existing);
      const index = state.courses.findIndex((candidate) => candidate.id === course.id);
      if (index >= 0) state.courses[index] = course;
      else state.courses.push(course);
      return state;
    }),
    /** Remove one course. */
    "course.delete": (body) => store.update((state) => {
      const id = typeof body?.id === "string" ? body.id : "";
      if (id === "") throw new InputError("invalid-id", "missing course id");
      state.courses = state.courses.filter((course) => course.id !== id);
      return state;
    }),
    /** Import many courses at once; `replace` drops the existing table first. */
    "course.import": (body) => store.update((state) => {
      const list = Array.isArray(body?.courses) ? body.courses : [];
      const cleaned = list.map((item) => cleanCourse(item));
      state.courses = body?.replace === true ? cleaned : [...state.courses, ...cleaned];
      return state;
    }),
    /** Create or replace one long-term plan. */
    "plan.save": (body) => store.update((state) => {
      const plan = cleanPlan(body?.plan, state.plans);
      const index = state.plans.findIndex((candidate) => candidate.id === plan.id);
      if (index >= 0) state.plans[index] = plan;
      else state.plans.push(plan);
      return state;
    }),
    /** Remove one plan. */
    "plan.delete": (body) => store.update((state) => {
      const id = typeof body?.id === "string" ? body.id : "";
      if (id === "") throw new InputError("invalid-id", "missing plan id");
      state.plans = state.plans.filter((plan) => plan.id !== id);
      return state;
    }),
    /** Tick or untick one milestone. */
    "plan.milestone": (body) => store.update((state) => {
      const plan = state.plans.find((candidate) => candidate.id === body?.planId);
      if (plan === void 0) throw new InputError("not-found", "that plan no longer exists");
      const milestone = plan.milestones.find((candidate) => candidate.id === body?.milestoneId);
      if (milestone === void 0) throw new InputError("not-found", "that milestone no longer exists");
      milestone.done = body?.done === true;
      plan.updatedAt = Date.now();
      if (plan.milestones.length > 0 && plan.milestones.every((item) => item.done)) plan.status = "done";
      else if (plan.status === "done") plan.status = "active";
      return state;
    }),
    /** Create many events at once (quick add confirmation, ICS import). */
    "event.import": (body) => store.update((state) => {
      const list = Array.isArray(body?.events) ? body.events : [];
      for (const item of list) state.events.push(cleanEvent(item));
      return state;
    }),
    /** One sentence in, candidate events out; nothing is stored yet. */
    "parse.events": async (body) => {
      const text = String(body?.text ?? "").trim();
      if (text === "") throw new InputError("empty-text", "write a sentence first");
      const llm = requireLlm(context);
      const route = modelRoute(context, llm);
      const events = await parseEvents(llm, route, text);
      return {
        events: events.map((row) => cleanEvent({ ...row, source: "ai" })),
        model: `${route.provider}/${route.model}`
      };
    },
    /** A pasted timetable in, candidate courses out; nothing is stored yet. */
    "parse.timetable": async (body) => {
      const text = String(body?.text ?? "").trim();
      if (text === "") throw new InputError("empty-text", "paste a timetable first");
      const llm = requireLlm(context);
      const route = modelRoute(context, llm);
      const rows = await parseCourses(llm, route, text);
      return {
        courses: rows.map((row) => cleanCourse(row)),
        model: `${route.provider}/${route.model}`
      };
    },
    /** The whole calendar as an iCalendar document. */
    "io.export.ics": () => ({
      text: toIcs(store.state.events),
      count: store.state.events.length
    }),
    /** Merge events from an iCalendar document. */
    "io.import.ics": (body) => {
      const text = String(body?.text ?? "");
      if (text.trim() === "") throw new InputError("empty-text", "the file is empty");
      const parsed = fromIcs(text);
      const state = store.update((current) => {
        for (const draft of parsed.events) current.events.push(cleanEvent(draft));
        return current;
      });
      return { state, added: parsed.events.length, skipped: parsed.skipped };
    },
    /** A complete JSON backup of the document. */
    "io.backup": () => ({
      json: JSON.stringify(store.state, null, 2),
      path: store.path
    }),
    /** Replace the whole document from a JSON backup. */
    "io.restore": (body) => {
      const raw = String(body?.json ?? "");
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new InputError("invalid-json", "that file is not valid JSON");
      }
      const next = normalize(parsed);
      const state = store.update((current) => {
        current.term = next.term;
        current.events = next.events;
        current.courses = next.courses;
        current.plans = next.plans;
        current.settings = next.settings;
        return current;
      });
      return { state };
    }
  };
}
function requireLlm(context) {
  const llm = context.get("llm");
  if (llm === void 0 || typeof llm.stream !== "function") {
    throw new InputError("no-model", "this DSH composition exposes no model service");
  }
  return llm;
}
function modelRoute(context, llm) {
  const defaults = context.get("agentDefaultModel");
  const selection = defaults?.currentSelection?.();
  if (selection?.provider !== void 0 && selection?.model !== void 0) {
    return { provider: selection.provider, model: selection.model };
  }
  for (const provider of llm.listProviders?.() ?? []) {
    const first = provider.models?.[0];
    if (first !== void 0) return { provider: provider.name, model: first.id };
  }
  throw new InputError("no-model", "no model is configured in this DSH profile");
}
function eventsInRange(state, from, to) {
  const start = parseStamp(`${from}T00:00`);
  const end = parseStamp(`${to}T23:59`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
  return expandAll(state.events, start, end).map((occurrence) => ({
    id: occurrence.event.id,
    title: occurrence.event.title,
    start: `${occurrence.start.getFullYear()}-${String(occurrence.start.getMonth() + 1).padStart(2, "0")}-${String(occurrence.start.getDate()).padStart(2, "0")}T${String(occurrence.start.getHours()).padStart(2, "0")}:${String(occurrence.start.getMinutes()).padStart(2, "0")}`,
    end: `${occurrence.end.getFullYear()}-${String(occurrence.end.getMonth() + 1).padStart(2, "0")}-${String(occurrence.end.getDate()).padStart(2, "0")}T${String(occurrence.end.getHours()).padStart(2, "0")}:${String(occurrence.end.getMinutes()).padStart(2, "0")}`,
    ...occurrence.event.location !== void 0 ? { location: occurrence.event.location } : {}
  }));
}
function apply(ctx) {
  const store = openStore(process.env, (error) => {
    ctx.logger?.warn("[dsh-schedule-calendar] storage error:", error);
  });
  const engine = new ReminderEngine({
    state: () => store.state,
    logPath: join2(dataDir(process.env), "notifications.json"),
    onError: (error) => ctx.logger?.warn("[dsh-schedule-calendar] reminder log error:", error)
  });
  const router = createRouter(store, engine, ctx);
  registerCalendarTools(ctx, {
    add: (events) => store.update((state) => {
      const created = [];
      for (const row of events) {
        const event = cleanEvent({ ...row, source: "ai" });
        state.events.push(event);
        created.push(event);
      }
      return created.map((event) => ({ id: event.id, title: event.title, start: event.start, end: event.end }));
    }),
    list: (from, to) => eventsInRange(store.state, from, to),
    remove: (ids) => store.update((state) => {
      const wanted = new Set(ids);
      const removed = state.events.filter((event) => wanted.has(event.id));
      state.events = state.events.filter((event) => !wanted.has(event.id));
      return removed.map((event) => ({ id: event.id, title: event.title, start: event.start, end: event.end }));
    })
  });
  installApprovalGate(ctx, {
    lookup: (ids) => ids.map((id) => store.state.events.find((event) => event.id === id)).filter((event) => event !== void 0).map((event) => ({ title: event.title, start: event.start, end: event.end }))
  });
  ctx.effect(() => engine.start(), "dsh-schedule-calendar: reminder scan");
  ctx.effect(
    () => ctx.webServer.register({
      kind: "prefix",
      path: ROUTE,
      handler: async (req, res) => {
        const connection = ctx.get("connection");
        if (connection?.requestRejection && connection.requestRejection(req) !== void 0) {
          send(res, 403, { ok: false, error: { code: "forbidden", message: "request rejected" } });
          return;
        }
        const url = new URL(req.url ?? "/", "http://dsh.internal");
        const method = url.pathname.slice(ROUTE.length).replace(/^\/+/, "");
        const handler = router[method];
        if (handler === void 0) {
          send(res, 404, { ok: false, error: { code: "unknown-method", message: method } });
          return;
        }
        if (req.method !== "POST" && req.method !== "GET") {
          send(res, 405, { ok: false, error: { code: "method-not-allowed" } });
          return;
        }
        try {
          const body = req.method === "POST" ? await readJson(req) : Object.fromEntries(url.searchParams);
          const value = await handler(body);
          send(res, 200, { ok: true, value });
        } catch (error) {
          const code = error instanceof InputError ? error.code : error instanceof ParseError ? error.code : "internal";
          const message = error instanceof Error ? error.message : String(error);
          send(res, 200, { ok: false, error: { code, message } });
        }
      }
    }),
    "dsh-schedule-calendar: route family"
  );
  ctx.effect(() => () => store.flush(), "dsh-schedule-calendar: flush on dispose");
}
export {
  ReminderEngine,
  apply,
  expandAll,
  expandEvent,
  inject,
  name,
  parseStamp,
  stamp
};
//# sourceMappingURL=index.js.map
