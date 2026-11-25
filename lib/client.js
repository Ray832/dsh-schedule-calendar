window.__ModuleLoader__.load({
	id: "dsh-schedule-calendar",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var index_exports = {};
__export(index_exports, {
  PANEL_ID: () => PANEL_ID,
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/client/css.ts
var CSS = `
.dshc-root {
  --dshc-bg: var(--dsw-alias-bg-base, var(--dsw-bg-base, #ffffff));
  --dshc-panel: var(--dsw-alias-bg-elevated, var(--dsw-bg-elevated, #ffffff));
  --dshc-text: var(--dsw-alias-text-primary, var(--dsw-text-primary, #1b1b1f));
  --dshc-muted: var(--dsw-alias-text-secondary, var(--dsw-text-secondary, #6b7280));
  --dshc-border: var(--dsw-alias-border-subtle, var(--dsw-border-subtle, #e5e7eb));
  --dshc-accent: var(--dsw-alias-brand-primary, var(--dsw-brand-primary, #4d6bfe));
  --dshc-hover: var(--dsw-alias-bg-hover, var(--dsw-bg-hover, rgba(0,0,0,.045)));
  --dshc-radius: 10px;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: var(--dshc-text);
  background: var(--dshc-bg);
  font-size: 14px;
  line-height: 1.5;
}
.dshc-root *, .dshc-root *::before, .dshc-root *::after { box-sizing: border-box; }
.dshc-root button, .dshc-root input, .dshc-root select, .dshc-root textarea { font: inherit; color: inherit; }

.dshc-head {
  display: flex; align-items: center; gap: 12px; flex: none;
  padding: 14px 20px 10px; border-bottom: 1px solid var(--dshc-border);
}
.dshc-title { font-size: 16px; font-weight: 600; margin: 0; }
.dshc-tabs { display: flex; gap: 4px; margin-left: auto; }
.dshc-tab {
  border: 1px solid transparent; background: none; color: var(--dshc-muted);
  border-radius: 8px; padding: 5px 12px; cursor: pointer;
}
.dshc-tab:hover { background: var(--dshc-hover); color: var(--dshc-text); }
.dshc-tab[aria-selected="true"] {
  color: var(--dshc-text); background: var(--dshc-hover);
  border-color: var(--dshc-border); font-weight: 600;
}
.dshc-body { flex: 1; min-height: 0; overflow: auto; padding: 16px 20px 24px; }

.dshc-surface { display: flex; flex-direction: column; gap: 12px; min-height: 100%; }
.dshc-toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dshc-heading { font-size: 15px; margin-left: 4px; }
.dshc-icon-btn {
  width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid var(--dshc-border); background: var(--dshc-panel);
  border-radius: 8px; cursor: pointer; line-height: 1;
}
.dshc-icon-btn:hover { background: var(--dshc-hover); }
.dshc-btn {
  border: 1px solid var(--dshc-border); background: var(--dshc-panel);
  border-radius: 8px; padding: 4px 12px; cursor: pointer;
}
.dshc-btn:hover { background: var(--dshc-hover); }
.dshc-btn.is-primary { background: var(--dshc-accent); border-color: var(--dshc-accent); color: #fff; }
.dshc-btn.is-primary:hover { filter: brightness(1.05); }
.dshc-btn.is-danger { color: var(--dsw-alias-danger, #d33); border-color: currentColor; background: none; }
.dshc-seg { display: inline-flex; border: 1px solid var(--dshc-border); border-radius: 8px; overflow: hidden; margin-left: auto; }
.dshc-seg button { border: 0; background: none; padding: 4px 12px; cursor: pointer; color: var(--dshc-muted); }
.dshc-seg button[aria-pressed="true"] { background: var(--dshc-hover); color: var(--dshc-text); font-weight: 600; }

.dshc-grid {
  display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 1px;
  background: var(--dshc-border); border: 1px solid var(--dshc-border);
  border-radius: var(--dshc-radius); overflow: hidden;
}
.dshc-dow { background: var(--dshc-panel); padding: 7px 8px; font-size: 12px; color: var(--dshc-muted); text-align: center; }
.dshc-day { background: var(--dshc-bg); min-height: 96px; padding: 6px; display: flex; flex-direction: column; gap: 3px; cursor: pointer; }
.dshc-day:hover { background: var(--dshc-hover); }
.dshc-day.is-out { opacity: .45; }
.dshc-day.is-selected { box-shadow: inset 0 0 0 2px var(--dshc-accent); }
.dshc-daynum { font-weight: 600; font-size: 12px; }
.dshc-daynum.is-today {
  color: #fff; background: var(--dshc-accent); border-radius: 999px;
  width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center;
}
.dshc-daylist { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.dshc-more { font-size: 11px; color: var(--dshc-muted); padding-left: 4px; }

.dshc-chip-event {
  display: flex; gap: 4px; align-items: baseline; width: 100%; text-align: left;
  border: 0; border-left: 3px solid var(--dshc-accent); border-radius: 5px;
  padding: 2px 5px; font-size: 11.5px; cursor: pointer; overflow: hidden;
}
.dshc-chip-event.is-done .dshc-chiptitle { text-decoration: line-through; opacity: .6; }
.dshc-chiptime { color: var(--dshc-muted); flex: none; font-variant-numeric: tabular-nums; }
.dshc-chiptitle { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.dshc-week { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; }
.dshc-weekcol { border: 1px solid var(--dshc-border); border-radius: var(--dshc-radius); display: flex; flex-direction: column; min-height: 320px; overflow: hidden; }
.dshc-weekcol.is-today { border-color: var(--dshc-accent); }
.dshc-weekhead {
  display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 8px;
  border: 0; border-bottom: 1px solid var(--dshc-border); background: var(--dshc-panel);
  cursor: pointer; font-size: 12px; color: var(--dshc-muted);
}
.dshc-weeklist { display: flex; flex-direction: column; gap: 4px; padding: 6px; }

.dshc-agenda { display: flex; flex-direction: column; border: 1px solid var(--dshc-border); border-radius: var(--dshc-radius); overflow: hidden; }
.dshc-agendarow {
  display: flex; align-items: center; gap: 10px; padding: 10px 14px;
  border: 0; border-bottom: 1px solid var(--dshc-border); background: none;
  text-align: left; cursor: pointer;
}
.dshc-agendarow:last-child { border-bottom: 0; }
.dshc-agendarow:hover { background: var(--dshc-hover); }
.dshc-agendatime { width: 52px; color: var(--dshc-muted); font-variant-numeric: tabular-nums; flex: none; }
.dshc-dot { width: 8px; height: 8px; border-radius: 999px; flex: none; }
.dshc-agendatitle.is-done { text-decoration: line-through; opacity: .6; }
.dshc-agendaloc { margin-left: auto; color: var(--dshc-muted); font-size: 12px; }

.dshc-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; min-height: 220px; color: var(--dshc-muted); text-align: center; line-height: 1.7;
}
.dshc-error { color: var(--dsw-alias-danger, #d33); margin: 0 0 8px; }

.dshc-backdrop {
  position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center;
  background: rgba(15, 18, 30, .38); padding: 24px;
}
.dshc-modal {
  width: min(520px, 100%); max-height: 88vh; display: flex; flex-direction: column;
  background: var(--dshc-panel); color: var(--dshc-text);
  border: 1px solid var(--dshc-border); border-radius: 14px;
  box-shadow: 0 24px 60px rgba(0,0,0,.22);
}
.dshc-modal-head { display: flex; align-items: center; padding: 14px 18px; border-bottom: 1px solid var(--dshc-border); }
.dshc-modal-head .dshc-icon-btn { margin-left: auto; border: 0; background: none; }
.dshc-modal-body { padding: 14px 18px; overflow: auto; display: flex; flex-direction: column; gap: 10px; }
.dshc-modal-foot { display: flex; gap: 8px; padding: 12px 18px; border-top: 1px solid var(--dshc-border); }
.dshc-field { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; font-size: 12px; color: var(--dshc-muted); }
.dshc-field > input, .dshc-field > select, .dshc-field > textarea {
  border: 1px solid var(--dshc-border); border-radius: 8px; padding: 6px 9px;
  background: var(--dshc-bg); color: var(--dshc-text); font-size: 13px; width: 100%;
}
.dshc-field > input:focus, .dshc-field > select:focus, .dshc-field > textarea:focus {
  outline: 2px solid color-mix(in srgb, var(--dshc-accent) 45%, transparent); outline-offset: 1px;
}
.dshc-field.dshc-check { flex-direction: row; align-items: center; gap: 6px; color: var(--dshc-text); font-size: 13px; }
.dshc-row { display: flex; gap: 10px; align-items: flex-end; }
.dshc-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.dshc-chip {
  border: 1px solid var(--dshc-border); background: var(--dshc-bg); color: var(--dshc-muted);
  border-radius: 999px; padding: 3px 10px; font-size: 12px; cursor: pointer;
}
.dshc-chip.is-on { border-color: var(--dshc-accent); color: var(--dshc-accent); background: color-mix(in srgb, var(--dshc-accent) 12%, transparent); }
.dshc-swatch { width: 22px; height: 22px; border-radius: 999px; border: 2px solid transparent; cursor: pointer; }
.dshc-swatch.is-on { border-color: var(--dshc-text); }
.dshc-busy { position: fixed; top: 0; left: 0; right: 0; height: 2px; background: var(--dshc-accent); animation: dshc-busy 1s linear infinite; z-index: 70; }
@keyframes dshc-busy { from { opacity: 1 } to { opacity: .25 } }

.dshc-notices {
  --dshc-panel: var(--dsw-alias-bg-elevated, var(--dsw-bg-elevated, #ffffff));
  --dshc-text: var(--dsw-alias-text-primary, var(--dsw-text-primary, #1b1b1f));
  --dshc-muted: var(--dsw-alias-text-secondary, var(--dsw-text-secondary, #6b7280));
  --dshc-border: var(--dsw-alias-border-subtle, var(--dsw-border-subtle, #e5e7eb));
  --dshc-accent: var(--dsw-alias-brand-primary, var(--dsw-brand-primary, #4d6bfe));
  --dshc-hover: var(--dsw-alias-bg-hover, var(--dsw-bg-hover, rgba(0,0,0,.045)));
  position: fixed; right: 18px; bottom: 18px; z-index: 80;
  display: flex; flex-direction: column; gap: 10px; width: min(340px, calc(100vw - 36px));
  pointer-events: none;
}
.dshc-notice {
  pointer-events: auto;
  display: flex; flex-direction: column; gap: 4px;
  background: var(--dshc-panel, #fff); color: var(--dshc-text, #1b1b1f);
  border: 1px solid var(--dshc-border, #e5e7eb); border-left: 3px solid var(--dshc-accent, #4d6bfe);
  border-radius: 12px; padding: 10px 12px;
  box-shadow: 0 14px 36px rgba(0,0,0,.18);
  animation: dshc-notice-in .18s ease-out;
  font-size: 13px;
}
@keyframes dshc-notice-in { from { transform: translateY(6px); opacity: 0 } to { transform: none; opacity: 1 } }
.dshc-notice-head { display: flex; align-items: center; gap: 8px; font-size: 11.5px; color: var(--dshc-muted, #6b7280); }
.dshc-notice-kind { font-weight: 600; letter-spacing: .02em; }
.dshc-notice-time { margin-right: auto; }
.dshc-notice-x { border: 0; background: none; cursor: pointer; color: inherit; line-height: 1; padding: 2px 4px; border-radius: 6px; }
.dshc-notice-x:hover { background: var(--dshc-hover, rgba(0,0,0,.05)); }
.dshc-notice-title { font-size: 14px; }
.dshc-notice-loc { color: var(--dshc-muted, #6b7280); font-size: 12px; }
.dshc-notice-actions { display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap; }

.dshc-hint { color: var(--dshc-muted); font-size: 12px; margin: 4px 0 0; }
.dshc-pre {
  margin: 0; padding: 8px 10px; border: 1px solid var(--dshc-border); border-radius: 8px;
  background: var(--dshc-hover); font-size: 11.5px; line-height: 1.5; overflow: auto; color: var(--dshc-muted);
  white-space: pre; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.dshc-section { display: flex; flex-direction: column; gap: 8px; padding-bottom: 12px; border-bottom: 1px solid var(--dshc-border); }
.dshc-section:last-child { border-bottom: 0; padding-bottom: 0; }
.dshc-section h3 { margin: 0; font-size: 13px; font-weight: 600; }
.dshc-switch { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; cursor: pointer; line-height: 1.5; }
.dshc-switch input { margin-top: 3px; }
.dshc-periods { display: flex; flex-direction: column; gap: 6px; }
.dshc-periods { max-height: 220px; overflow: auto; padding-right: 4px; }
.dshc-period { display: flex; align-items: center; gap: 6px; font-size: 12px; }
.dshc-period input[type="time"] {
  border: 1px solid var(--dshc-border); border-radius: 6px; padding: 2px 6px; background: var(--dshc-bg); color: var(--dshc-text);
}
.dshc-period-index { width: 58px; color: var(--dshc-muted); }

.dshc-tt { display: grid; gap: 1px; background: var(--dshc-border); border: 1px solid var(--dshc-border); border-radius: var(--dshc-radius); overflow: hidden; }
.dshc-tt-corner, .dshc-tt-head, .dshc-tt-time { background: var(--dshc-panel); padding: 6px; font-size: 12px; color: var(--dshc-muted); text-align: center; }
.dshc-tt-head { font-weight: 600; color: var(--dshc-text); }
.dshc-tt-time { display: flex; flex-direction: column; align-items: center; gap: 2px; line-height: 1.25; }
.dshc-tt-time strong { color: var(--dshc-text); font-size: 13px; }
.dshc-tt-time span { font-size: 10.5px; font-variant-numeric: tabular-nums; }
.dshc-tt-cell { background: var(--dshc-bg); border: 0; min-height: 46px; cursor: pointer; }
.dshc-tt-cell:hover { background: var(--dshc-hover); }
.dshc-tt-course {
  display: flex; flex-direction: column; gap: 1px; align-items: flex-start; text-align: left;
  margin: 2px; padding: 4px 6px; border: 0; border-left: 3px solid var(--dshc-accent);
  border-radius: 6px; cursor: pointer; overflow: hidden; font-size: 11.5px; min-height: 0;
}
.dshc-tt-course strong { font-size: 12px; font-weight: 600; }
.dshc-tt-course span { color: var(--dshc-muted); font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }

.dshc-planlist { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; }
.dshc-plancard {
  display: flex; flex-direction: column; gap: 8px; text-align: left;
  border: 1px solid var(--dshc-border); border-radius: var(--dshc-radius);
  background: var(--dshc-panel); padding: 12px 14px; cursor: pointer;
}
.dshc-plancard:hover { background: var(--dshc-hover); }
.dshc-plancard-top { display: flex; align-items: center; gap: 6px; }
.dshc-plancard-top strong { font-size: 14px; }
.dshc-tag { font-size: 10.5px; padding: 1px 6px; border-radius: 999px; background: var(--dshc-hover); color: var(--dshc-muted); }
.dshc-tag.is-hot { color: var(--dsw-alias-danger, #d33); background: color-mix(in srgb, var(--dsw-alias-danger, #d33) 14%, transparent); }
.dshc-bar { height: 6px; border-radius: 999px; background: var(--dshc-hover); overflow: hidden; }
.dshc-bar i { display: block; height: 100%; background: var(--dshc-accent); border-radius: 999px; transition: width .2s ease; }
.dshc-plan-meta { display: flex; gap: 10px; flex-wrap: wrap; font-size: 12px; color: var(--dshc-muted); }
.dshc-plan-due { color: var(--dshc-accent); }
.dshc-plan-head { display: flex; flex-direction: column; gap: 8px; padding: 4px 2px 12px; border-bottom: 1px solid var(--dshc-border); }
.dshc-plan-head h2 { margin: 0; font-size: 18px; }
.dshc-plan-goal { margin: 0; color: var(--dshc-muted); font-size: 13px; line-height: 1.6; }
.dshc-milestones { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.dshc-milestone { display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; padding: 6px 8px; border-radius: 8px; }
.dshc-milestone:hover { background: var(--dshc-hover); }
.dshc-milestone-title.is-done { text-decoration: line-through; opacity: .6; }
.dshc-milestone-due { margin-left: auto; color: var(--dshc-muted); font-size: 12px; font-variant-numeric: tabular-nums; }
.dshc-milestone-row { display: flex; gap: 6px; align-items: center; }
.dshc-milestone-row input[type="text"], .dshc-milestone-row input[type="date"] {
  border: 1px solid var(--dshc-border); border-radius: 7px; padding: 4px 8px;
  background: var(--dshc-bg); color: var(--dshc-text); font-size: 12.5px;
}
.dshc-milestone-row input[type="text"] { flex: 1; }

.dshc-quick { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.dshc-quick-row { display: flex; gap: 8px; }
.dshc-quick-row input {
  flex: 1; border: 1px solid var(--dshc-border); border-radius: 9px;
  padding: 7px 11px; background: var(--dshc-panel); color: var(--dshc-text); font-size: 13px;
}
.dshc-quick-row input:focus { outline: 2px solid color-mix(in srgb, var(--dshc-accent) 45%, transparent); outline-offset: 1px; }
.dshc-link { border: 0; background: none; color: var(--dshc-accent); cursor: pointer; margin-left: 8px; padding: 0; font-size: 12px; }
.dshc-preview { border: 1px solid var(--dshc-border); border-radius: var(--dshc-radius); background: var(--dshc-panel); padding: 10px 12px; }
.dshc-preview-head { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--dshc-muted); }
.dshc-preview-list { list-style: none; margin: 8px 0 4px; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.dshc-preview-list li { display: flex; align-items: baseline; gap: 8px; font-size: 13px; flex-wrap: wrap; }
.dshc-preview-list li span { color: var(--dshc-muted); font-size: 12px; }
.dshc-details summary { cursor: pointer; font-size: 12px; color: var(--dshc-muted); }
`;

// src/client/Icon.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function CalendarIcon({ size = 16 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true", focusable: "false", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "2", y: "3", width: "12", height: "11", rx: "2", stroke: "currentColor", strokeWidth: "1.3" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M2 6.5h12", stroke: "currentColor", strokeWidth: "1.3" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M5.5 2v2.4M10.5 2v2.4", stroke: "currentColor", strokeWidth: "1.3", strokeLinecap: "round" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "5", y: "8.5", width: "2.2", height: "2.2", rx: "0.6", fill: "currentColor" })
  ] });
}

// src/client/i18n.ts
var import_react = require("react");
var EN = {
  // shell
  日程: "Schedule",
  日历: "Calendar",
  课表: "Timetable",
  规划: "Plans",
  设置: "Settings",
  "载入中…": "Loading…",
  关闭: "Close",
  取消: "Cancel",
  保存: "Save",
  删除: "Delete",
  编辑: "Edit",
  添加: "Add",
  重试: "Retry",
  选填: "optional",
  // calendar
  上一页: "Previous",
  下一页: "Next",
  今天: "Today",
  月: "M",
  周: "W",
  日: "D",
  "视图": "View",
  "新建": "New",
  "这一天还没有安排": "Nothing planned for this day",
  "点右上角「新建」添加一条，或在对话框里直接说「明天下午三点组会」。": "Use “New” above, or just tell the assistant “team meeting tomorrow at 3pm”.",
  "全天": "All day",
  // event editor
  新建日程: "New event",
  编辑日程: "Edit event",
  标题: "Title",
  日期: "Date",
  开始: "Start",
  结束: "End",
  地点: "Location",
  备注: "Notes",
  提前提醒: "Remind me",
  准时: "On time",
  重复: "Repeat",
  重复截止: "Repeat until",
  星期: "Weekdays",
  颜色: "Color",
  不重复: "Does not repeat",
  每天: "Daily",
  工作日: "Weekdays",
  每周: "Weekly",
  每两周: "Every two weeks",
  每月: "Monthly",
  "例如：高等数学第 3 章复习": "e.g. Review chapter 3 of Calculus",
  "请填写标题": "Please add a title",
  "结束时间不能早于开始时间": "The end must not be before the start",
  "{n} 分钟": "{n} min",
  // timetable
  课表未启用: "Timetable is off",
  "启用后可以按学期周次查看课程，并支持粘贴文本、手动录入或导入 CSV。": "Turn it on to see courses by teaching week, and to paste, type or import a timetable.",
  启用课表: "Turn on the timetable",
  上一周: "Previous week",
  本周: "This week",
  下一周: "Next week",
  "第 {n} 周": "Week {n}",
  "（本周是第 {n} 周）": "(this week is week {n})",
  导入: "Import",
  "+ 添加课程": "+ Add course",
  还没有节次时间: "No bell schedule yet",
  "先到设置里配置每天第几节几点上课，课表格子才能排出来。": "Set the period times in Settings first, then the grid can be laid out.",
  节次: "Period",
  "第 {n} 节": "P{n}",
  "添加课程": "Add course",
  "编辑课程": "Edit course",
  课程名称: "Course",
  教师: "Teacher",
  起始节: "First period",
  结束节: "Last period",
  起始周: "First week",
  结束周: "Last week",
  单双周: "Week parity",
  单周: "Odd weeks",
  双周: "Even weeks",
  "请填写课程名称": "Please add a course name",
  "本学期共 {total} 周，已录入 {courses} 门课程，本周显示 {visible} 门。": "The term runs {total} weeks; {courses} courses saved, {visible} shown this week.",
  "导入课表": "Import timetable",
  "三种方式任选：让 AI 解析你粘贴的课表文字、选择教务系统导出的 CSV 文件，或按下面的列顺序自己排版。": "Choose one: let the AI parse pasted text, pick a CSV exported by your school system, or lay it out yourself in the column order below.",
  "选择 CSV 文件": "Choose a CSV file",
  "AI 解析这段文本": "Parse this text with AI",
  "解析中…": "Parsing…",
  "填入示例": "Fill in a sample",
  "粘贴内容": "Paste here",
  "CSV 列格式": "CSV columns",
  "覆盖已有课程（不勾选则追加）": "Replace existing courses (unchecked appends)",
  "识别到 {n} 门课程": "{n} courses found",
  "，{n} 行无法识别": ", {n} lines unreadable",
  "导入 {n} 门": "Import {n}",
  "也可以直接贴教务系统复制的课表文字，再点「AI 解析」": "You can also paste timetable text copied from your school system, then press “Parse with AI”.",
  "例如：高等数学": "e.g. Calculus",
  "由 {model} 解析出 {n} 门课程": "{model} parsed {n} courses",
  "删除第 {n} 节": "Delete period {n}",
  "例如：期末复习完高数": "e.g. Finish the Calculus revision",
  "删除里程碑": "Delete milestone",
  "‹ 全部目标": "‹ All goals",
  说明: "Notes",
  "+ 增加一节": "+ Add a period",
  // plans
  长期目标: "Long-term goals",
  "+ 新建目标": "+ New goal",
  还没有目标: "No goals yet",
  "把一个长期任务拆成几个里程碑，进度就会一目了然。比如「期末复习」拆成三章 + 两套真题。": "Split a long task into milestones and the progress becomes obvious — e.g. “Final review” into three chapters and two mock exams.",
  "{n}% 完成": "{n}% done",
  "截止 {date}": "Due {date}",
  "还有 {n} 天": "{n} days left",
  "已逾期 {n} 天": "{n} days overdue",
  今天截止: "Due today",
  明天截止: "Due tomorrow",
  "{done}/{total} 个里程碑": "{done}/{total} milestones",
  已完成: "Done",
  重要: "Important",
  全部目标: "All goals",
  里程碑: "Milestones",
  "加一个里程碑，回车确认": "Add a milestone, press Enter",
  目标: "Goal",
  "选填：为什么要做、做到什么程度算完成": "optional: why, and what done looks like",
  截止日: "Due date",
  优先级: "Priority",
  低: "Low",
  普通: "Normal",
  新建目标: "New goal",
  编辑目标: "Edit goal",
  "还没有里程碑，点「编辑」把它们加进来。": "No milestones yet — add them from “Edit”.",
  "请填写目标名称": "Please add a goal name",
  // quick add
  "一句话添加，例如：明天下午三点组会，提前十分钟提醒": "One sentence, e.g. “team meeting tomorrow at 3pm, remind me 10 minutes before”",
  解析: "Parse",
  "识别到 {n} 条日程 · 由 {model} 解析": "{n} events found · parsed by {model}",
  全部添加: "Add all",
  解析结果: "Parsed events",
  "解析结果先预览再落库；有问题就改一下措辞重新解析。": "Nothing is stored until you confirm; rephrase and parse again if it looks wrong.",
  // notices
  日程提醒: "Calendar reminder",
  错过的提醒: "Missed reminder",
  "提前 {n} 分钟": "{n} min ahead",
  完成: "Done",
  "5 分钟后": "In 5 min",
  "10 分钟后": "In 10 min",
  // settings
  "启用课表（关闭后左侧栏不再显示课表页）": "Enable the timetable (hides its tab when off)",
  开学第一周的周一: "Monday of week 1",
  总周数: "Weeks in term",
  节次时间: "Period times",
  "增加一节": "+ Add a period",
  保存节次: "Save periods",
  提醒: "Reminders",
  提醒时播放提示音: "Play a sound with reminders",
  "同时发系统通知（DSH 最小化时也能看到）": "Also raise a system notification (visible when DSH is minimised)",
  "当前环境没有系统通知权限，到点仍会弹出应用内提醒。": "This environment grants no system-notification permission; the in-app reminder still appears.",
  免打扰时段: "Quiet hours",
  从: "From",
  到: "To",
  每周从: "Week starts on",
  周一开始: "Monday",
  周日开始: "Sunday",
  新建日程默认提前提醒: "Default lead time for new events",
  准时提醒: "On time",
  数据: "Data",
  "导出 ICS": "Export ICS",
  "导入 ICS": "Import ICS",
  导出备份: "Export backup",
  恢复备份: "Restore backup",
  "恢复备份会覆盖当前的日程、课表和目标，确定继续？": "Restoring replaces the current events, timetable and goals. Continue?",
  "已导出 {n} 条日程为 ICS": "Exported {n} events as ICS",
  "已导出 JSON 备份": "JSON backup exported",
  "已从 {file} 恢复": "Restored from {file}",
  "从 {file} 导入 {n} 条": "Imported {n} events from {file}",
  "，跳过 {n} 条": ", skipped {n}",
  "数据文件：": "Data file: "
};
var current = "zh";
var listeners = /* @__PURE__ */ new Set();
function detect() {
  try {
    return normalize(document.documentElement.lang || navigator.language || "zh");
  } catch {
    return "zh";
  }
}
function normalize(id) {
  return id.toLowerCase().startsWith("en") ? "en" : "zh";
}
current = detect();
function setLanguage(id) {
  const next = normalize(id);
  if (next === current) return;
  current = next;
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch {
    }
  }
}
function language() {
  return current;
}
function t(zh, params) {
  const template = current === "en" ? EN[zh] ?? zh : zh;
  if (params === void 0) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => key in params ? String(params[key]) : match);
}
function subscribeLanguage(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function useT() {
  (0, import_react.useSyncExternalStore)(subscribeLanguage, language, () => "zh");
  return t;
}

// src/client/NoticeHost.tsx
var import_react2 = require("react");

// src/client/api.ts
var ApiError = class extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.code = code;
  }
};
async function call(method, body = {}, signal) {
  const url = new URL(`api/dsh-calendar/${method}`, document.baseURI);
  const response = await fetch(url.href, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
    credentials: "same-origin",
    signal
  });
  const data = await response.json();
  if (!data.ok) throw new ApiError(data.error.code, data.error.message ?? "The calendar request failed.");
  return data.value;
}

// src/client/dates.ts
function pad(value) {
  return String(value).padStart(2, "0");
}
function ymd(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function parseLocal(value) {
  const text = value.length > 10 ? value.slice(0, 10) : value;
  const [y, m, d] = text.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}
function addDays(date, days) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}
function isoWeekday(date) {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function monthMatrix(year, month, weekStart2) {
  const first = new Date(year, month, 1);
  const offset = weekStart2 === 1 ? isoWeekday(first) - 1 : first.getDay();
  const start = addDays(first, -offset);
  const weeks = [];
  for (let row = 0; row < 6; row += 1) {
    const week = [];
    for (let col = 0; col < 7; col += 1) week.push(addDays(start, row * 7 + col));
    weeks.push(week);
  }
  return weeks;
}
function weekdayLabels(weekStart2, locale) {
  const monday = new Date(2024, 0, 1);
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(monday, weekStart2 === 1 ? i : (i + 6) % 7);
    return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(day);
  });
}
function monthTitle(year, month, locale) {
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "long" }).format(new Date(year, month, 1));
}
function clockOf(value) {
  return value.length >= 16 ? value.slice(11, 16) : "";
}

// src/client/NoticeHost.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var POLL_MS = 15e3;
var MAX_CARDS = 4;
function chime() {
  try {
    const Ctor = window.AudioContext ?? window.webkitAudioContext;
    if (Ctor === void 0) return;
    const audio = new Ctor();
    const now = audio.currentTime;
    for (const [index, frequency] of [880, 1174].entries()) {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(1e-4, now + index * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.12, now + index * 0.16 + 0.02);
      gain.gain.exponentialRampToValueAtTime(1e-4, now + index * 0.16 + 0.15);
      osc.connect(gain).connect(audio.destination);
      osc.start(now + index * 0.16);
      osc.stop(now + index * 0.16 + 0.18);
    }
    setTimeout(() => void audio.close().catch(() => {
    }), 800);
  } catch {
  }
}
function systemNotify(notice) {
  try {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    const body = [notice.allDay ? t("全天") : clockOf(notice.start), notice.location].filter(Boolean).join(" · ");
    new Notification(notice.title, { body, tag: notice.id });
  } catch {
  }
}
function NoticeHost() {
  const t2 = useT();
  const [notices, setNotices] = (0, import_react2.useState)([]);
  const settingsRef = (0, import_react2.useRef)(null);
  const loadSettings = (0, import_react2.useCallback)(async () => {
    try {
      const state = await call("state.get");
      settingsRef.current = state.settings;
    } catch {
    }
  }, []);
  const poll = (0, import_react2.useCallback)(async () => {
    try {
      const due = await call("notify.pending");
      if (due.length === 0) return;
      setNotices((current2) => {
        const seen = new Set(current2.map((notice) => notice.id));
        const merged = [...current2, ...due.filter((notice) => !seen.has(notice.id))];
        return merged.slice(-MAX_CARDS);
      });
      const settings = settingsRef.current;
      if (settings === null || settings.soundEnabled) chime();
      if (settings === null || settings.systemNotification) {
        for (const notice of due) systemNotify(notice);
      }
    } catch {
    }
  }, []);
  (0, import_react2.useEffect)(() => {
    void loadSettings();
    void poll();
    const timer = setInterval(() => void poll(), POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void loadSettings();
        void poll();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [loadSettings, poll]);
  const dismiss = (0, import_react2.useCallback)((id) => {
    setNotices((current2) => current2.filter((notice) => notice.id !== id));
    void call("notify.ack", { id }).catch(() => {
    });
  }, []);
  const snooze = (0, import_react2.useCallback)((id, minutes) => {
    setNotices((current2) => current2.filter((notice) => notice.id !== id));
    void call("notify.snooze", { id, minutes }).catch(() => {
    });
  }, []);
  const complete = (0, import_react2.useCallback)((notice) => {
    setNotices((current2) => current2.filter((item) => item.id !== notice.id));
    void call("notify.complete", { eventId: notice.eventId }).catch(() => {
    });
    void call("notify.ack", { id: notice.id }).catch(() => {
    });
  }, []);
  if (notices.length === 0) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshc-notices", role: "region", "aria-label": t2("日程提醒"), children: notices.map((notice) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("article", { className: "dshc-notice", role: "alert", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("header", { className: "dshc-notice-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshc-notice-kind", children: notice.missed === true ? t2("错过的提醒") : t2("日程提醒") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "dshc-notice-time", children: [
        notice.allDay ? t2("全天") : clockOf(notice.start),
        notice.leadMinutes > 0 ? ` · ${t2("提前 {n} 分钟", { n: notice.leadMinutes })}` : ""
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dshc-notice-x", "aria-label": t2("关闭"), onClick: () => dismiss(notice.id), children: "✕" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { className: "dshc-notice-title", children: notice.title }),
    notice.location !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshc-notice-loc", children: notice.location }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshc-notice-actions", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dshc-btn is-primary", onClick: () => complete(notice), children: t2("完成") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dshc-btn", onClick: () => snooze(notice.id, 5), children: t2("5 分钟后") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dshc-btn", onClick: () => snooze(notice.id, 10), children: t2("10 分钟后") })
    ] })
  ] }, notice.id)) });
}
async function ensureNotificationPermission() {
  try {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "default") return;
    await Notification.requestPermission();
  } catch {
  }
}

// src/client/Page.tsx
var import_react9 = require("react");

// src/client/CalendarView.tsx
var import_react4 = require("react");

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
function dayKey(date) {
  return stamp(date).slice(0, 10);
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

// src/client/EventEditor.tsx
var import_react3 = require("react");
var import_jsx_runtime3 = require("react/jsx-runtime");
var COLORS = {
  blue: "#4d6bfe",
  green: "#22a06b",
  amber: "#d98a00",
  rose: "#e2557b",
  violet: "#8b5cf6",
  slate: "#64748b"
};
var LEADS = [0, 5, 10, 30, 60];
var REPEATS = [
  { kind: "none", label: "不重复" },
  { kind: "daily", label: "每天" },
  { kind: "weekdays", label: "工作日" },
  { kind: "weekly", label: "每周" },
  { kind: "biweekly", label: "每两周" },
  { kind: "monthly", label: "每月" }
];
var WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];
function split(stamp2) {
  return { date: stamp2.slice(0, 10), time: stamp2.length >= 16 ? stamp2.slice(11, 16) : "09:00" };
}
function draftOf(initial, day) {
  if (initial === null) {
    return {
      title: "",
      date: `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`,
      startTime: "09:00",
      endTime: "10:00",
      allDay: false,
      location: "",
      note: "",
      color: "blue",
      leads: [10],
      repeat: "none",
      weekdays: [],
      until: ""
    };
  }
  const start = split(initial.start);
  const end = split(initial.end);
  const repeat = initial.repeat ?? { kind: "none" };
  return {
    title: initial.title,
    date: start.date,
    startTime: start.time,
    endTime: end.time,
    allDay: initial.allDay,
    location: initial.location ?? "",
    note: initial.note ?? "",
    color: initial.color ?? "blue",
    leads: initial.remindBefore ?? [],
    repeat: repeat.kind,
    weekdays: repeat.weekdays ?? [],
    until: repeat.until ?? ""
  };
}
function EventEditor({ initial, day, defaultLead = 10, onCancel, onSave, onDelete }) {
  const t2 = useT();
  const [draft, setDraft] = (0, import_react3.useState)(() => {
    const base = draftOf(initial, day);
    return initial === null ? { ...base, leads: [defaultLead] } : base;
  });
  const [error, setError] = (0, import_react3.useState)(null);
  const titleRef = (0, import_react3.useRef)(null);
  (0, import_react3.useEffect)(() => {
    titleRef.current?.focus();
    const onKey = (keyEvent) => {
      if (keyEvent.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  const patch = (next) => setDraft((current2) => ({ ...current2, ...next }));
  const repeatNeedsWeekdays = draft.repeat === "weekly" || draft.repeat === "biweekly";
  const weekdayLabels2 = language() === "en" ? ["M", "T", "W", "T", "F", "S", "S"] : WEEKDAYS;
  const effectiveWeekdays = (0, import_react3.useMemo)(() => {
    if (draft.weekdays.length > 0) return draft.weekdays;
    if (draft.date === "") return [];
    const d = /* @__PURE__ */ new Date(`${draft.date}T00:00`);
    return [d.getDay() === 0 ? 7 : d.getDay()];
  }, [draft.weekdays, draft.date]);
  const submit = () => {
    if (draft.title.trim() === "") {
      setError(t2("请填写标题"));
      return;
    }
    const start = `${draft.date}T${draft.allDay ? "00:00" : draft.startTime}`;
    const end = `${draft.date}T${draft.allDay ? "23:59" : draft.endTime}`;
    if (end < start) {
      setError(t2("结束时间不能早于开始时间"));
      return;
    }
    const repeat = { kind: draft.repeat };
    if (repeatNeedsWeekdays) repeat.weekdays = effectiveWeekdays;
    if (draft.until !== "") repeat.until = draft.until;
    onSave({
      ...initial ?? {},
      title: draft.title.trim(),
      start,
      end,
      allDay: draft.allDay,
      location: draft.location.trim() === "" ? void 0 : draft.location.trim(),
      note: draft.note.trim() === "" ? void 0 : draft.note,
      color: draft.color,
      remindBefore: draft.leads,
      repeat,
      source: initial?.source ?? "manual"
    });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dshc-backdrop", role: "presentation", onMouseDown: (e) => e.target === e.currentTarget && onCancel(), children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshc-modal", role: "dialog", "aria-modal": "true", "aria-label": initial === null ? t2("新建日程") : t2("编辑日程"), children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("header", { className: "dshc-modal-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: initial === null ? t2("新建日程") : t2("编辑日程") }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "dshc-icon-btn", onClick: onCancel, "aria-label": t2("关闭"), children: "✕" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshc-modal-body", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "dshc-field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: t2("标题") }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "input",
          {
            ref: titleRef,
            type: "text",
            value: draft.title,
            placeholder: t2("例如：高等数学第 3 章复习"),
            onChange: (e) => patch({ title: e.target.value })
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshc-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "dshc-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: t2("日期") }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: "date", value: draft.date, onChange: (e) => patch({ date: e.target.value }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "dshc-field dshc-check", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: "checkbox", checked: draft.allDay, onChange: (e) => patch({ allDay: e.target.checked }) }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: t2("全天") })
        ] })
      ] }),
      draft.allDay ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshc-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "dshc-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: t2("开始") }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: "time", value: draft.startTime, onChange: (e) => patch({ startTime: e.target.value }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "dshc-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: t2("结束") }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: "time", value: draft.endTime, onChange: (e) => patch({ endTime: e.target.value }) })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dshc-row", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "dshc-field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: t2("地点") }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: "text", value: draft.location, placeholder: t2("选填"), onChange: (e) => patch({ location: e.target.value }) })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "dshc-field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: t2("备注") }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("textarea", { rows: 2, value: draft.note, placeholder: t2("选填"), onChange: (e) => patch({ note: e.target.value }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshc-field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: t2("提前提醒") }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dshc-chips", children: LEADS.map((lead) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "button",
          {
            type: "button",
            className: `dshc-chip${draft.leads.includes(lead) ? " is-on" : ""}`,
            "aria-pressed": draft.leads.includes(lead),
            onClick: () => patch({
              leads: draft.leads.includes(lead) ? draft.leads.filter((v) => v !== lead) : [...draft.leads, lead].sort((a, b) => a - b)
            }),
            children: lead === 0 ? t2("准时") : t2("{n} 分钟", { n: lead })
          },
          lead
        )) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshc-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "dshc-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: t2("重复") }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("select", { value: draft.repeat, onChange: (e) => patch({ repeat: e.target.value }), children: REPEATS.map((option) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: option.kind, children: t2(option.label) }, option.kind)) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "dshc-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: t2("重复截止") }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: "date", value: draft.until, onChange: (e) => patch({ until: e.target.value }) })
        ] })
      ] }),
      repeatNeedsWeekdays ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshc-field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: t2("星期") }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dshc-chips", children: weekdayLabels2.map((label, index) => {
          const value = index + 1;
          const on = effectiveWeekdays.includes(value);
          return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            "button",
            {
              type: "button",
              className: `dshc-chip${on ? " is-on" : ""}`,
              "aria-pressed": on,
              onClick: () => patch({
                weekdays: on ? effectiveWeekdays.filter((v) => v !== value) : [...effectiveWeekdays, value].sort((a, b) => a - b)
              }),
              children: label
            },
            label
          );
        }) })
      ] }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshc-field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: t2("颜色") }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dshc-chips", children: Object.entries(COLORS).map(([key, hex]) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "button",
          {
            type: "button",
            className: `dshc-swatch${draft.color === key ? " is-on" : ""}`,
            style: { background: hex },
            "aria-label": key,
            "aria-pressed": draft.color === key,
            onClick: () => patch({ color: key })
          },
          key
        )) })
      ] }),
      error !== null ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "dshc-error", children: error }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("footer", { className: "dshc-modal-foot", children: [
      initial !== null && onDelete !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "dshc-btn is-danger", onClick: () => onDelete(initial.id), children: t2("删除") }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { marginLeft: "auto" } }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "dshc-btn", onClick: onCancel, children: t2("取消") }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "dshc-btn is-primary", onClick: submit, children: t2("保存") })
    ] })
  ] }) });
}

// src/client/CalendarView.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
function CalendarView({ state, locale, onCreate, onOpen }) {
  const t2 = useT();
  const today = (0, import_react4.useMemo)(() => /* @__PURE__ */ new Date(), []);
  const [view, setView] = (0, import_react4.useState)("month");
  const [cursor, setCursor] = (0, import_react4.useState)(() => new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const [selected, setSelected] = (0, import_react4.useState)(today);
  const range = (0, import_react4.useMemo)(() => {
    if (view === "month") {
      const weeks = monthMatrix(cursor.getFullYear(), cursor.getMonth(), state.settings.weekStart);
      const first = weeks[0]?.[0] ?? cursor;
      return { from: addDays(first, -1), to: addDays(first, 43) };
    }
    if (view === "week") {
      const start = addDays(cursor, -(state.settings.weekStart === 1 ? isoWeekday(cursor) - 1 : cursor.getDay()));
      return { from: addDays(start, -1), to: addDays(start, 8) };
    }
    const midnight2 = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
    return { from: addDays(midnight2, -1), to: addDays(midnight2, 2) };
  }, [view, cursor, state.settings.weekStart]);
  const byDay = (0, import_react4.useMemo)(() => {
    const map = /* @__PURE__ */ new Map();
    for (const occurrence of expandAll(state.events, range.from, range.to)) {
      const key = dayKey(occurrence.start);
      const list = map.get(key);
      if (list === void 0) map.set(key, [occurrence]);
      else list.push(occurrence);
    }
    return map;
  }, [state.events, range]);
  const step = (delta) => {
    if (view === "month") setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));
    else if (view === "week") setCursor(addDays(cursor, delta * 7));
    else setCursor(addDays(cursor, delta));
  };
  const heading = (0, import_react4.useMemo)(() => {
    if (view === "month") return monthTitle(cursor.getFullYear(), cursor.getMonth(), locale);
    if (view === "week") {
      const start = addDays(cursor, -(state.settings.weekStart === 1 ? isoWeekday(cursor) - 1 : cursor.getDay()));
      const end = addDays(start, 6);
      const fmt = (day) => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(day);
      return `${fmt(start)} – ${fmt(end)}`;
    }
    return new Intl.DateTimeFormat(locale, { month: "long", day: "numeric", weekday: "long" }).format(cursor);
  }, [view, cursor, locale, state.settings.weekStart]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dshc-surface", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dshc-toolbar", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: "dshc-icon-btn", "aria-label": t2("上一页"), onClick: () => step(-1), children: "‹" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: "dshc-btn", onClick: () => setCursor(new Date(today.getFullYear(), today.getMonth(), today.getDate())), children: t2("今天") }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: "dshc-icon-btn", "aria-label": t2("下一页"), onClick: () => step(1), children: "›" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { className: "dshc-heading", children: heading }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "dshc-seg", role: "group", "aria-label": t2("视图"), children: ["month", "week", "day"].map((mode) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", "aria-pressed": view === mode, onClick: () => setView(mode), children: mode === "month" ? t2("月") : mode === "week" ? t2("周") : t2("日") }, mode)) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { type: "button", className: "dshc-btn is-primary", onClick: () => onCreate(view === "day" ? cursor : selected), children: [
        "+ ",
        t2("新建")
      ] })
    ] }),
    view === "month" ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      MonthGrid,
      {
        cursor,
        weekdayStart: state.settings.weekStart,
        locale,
        byDay,
        selected,
        today,
        onSelect: setSelected,
        onCreate,
        onOpen
      }
    ) : null,
    view === "week" ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "dshc-week", children: Array.from({ length: 7 }, (_, index) => {
      const start = addDays(cursor, -(state.settings.weekStart === 1 ? isoWeekday(cursor) - 1 : cursor.getDay()));
      const day = addDays(start, index);
      const list = byDay.get(ymd(day)) ?? [];
      return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: `dshc-weekcol${sameDay(day, today) ? " is-today" : ""}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { type: "button", className: "dshc-weekhead", onClick: () => onCreate(day), children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: weekdayLabels(state.settings.weekStart, locale)[index] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { children: day.getDate() })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "dshc-weeklist", children: list.map((occurrence) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Chip, { occurrence, onOpen }, occurrence.key)) })
      ] }, ymd(day));
    }) }) : null,
    view === "day" ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "dshc-agenda", children: (byDay.get(ymd(cursor)) ?? []).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dshc-empty", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { children: t2("这一天还没有安排") }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: t2("点右上角「新建」添加一条，或在对话框里直接说「明天下午三点组会」。") })
    ] }) : (byDay.get(ymd(cursor)) ?? []).map((occurrence) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { type: "button", className: "dshc-agendarow", onClick: () => onOpen(occurrence.event), children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "dshc-agendatime", children: occurrence.event.allDay ? t2("全天") : clockOf(occurrence.event.start) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "dshc-dot", style: { background: COLORS[occurrence.event.color ?? "blue"] ?? COLORS.blue } }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: `dshc-agendatitle${occurrence.event.done === true ? " is-done" : ""}`, children: occurrence.event.title }),
      occurrence.event.location !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "dshc-agendaloc", children: occurrence.event.location }) : null
    ] }, occurrence.key)) }) : null
  ] });
}
function MonthGrid({ cursor, weekdayStart, locale, byDay, selected, today, onSelect, onCreate, onOpen }) {
  const weeks = (0, import_react4.useMemo)(() => monthMatrix(cursor.getFullYear(), cursor.getMonth(), weekdayStart), [cursor, weekdayStart]);
  const labels = (0, import_react4.useMemo)(() => weekdayLabels(weekdayStart, locale), [weekdayStart, locale]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dshc-grid", children: [
    labels.map((label) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "dshc-dow", children: label }, label)),
    weeks.flat().map((day) => {
      const outside = day.getMonth() !== cursor.getMonth();
      const list = byDay.get(ymd(day)) ?? [];
      return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
        "div",
        {
          className: `dshc-day${outside ? " is-out" : ""}${sameDay(day, selected) ? " is-selected" : ""}`,
          onClick: () => onSelect(day),
          onDoubleClick: () => onCreate(day),
          role: "gridcell",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: `dshc-daynum${sameDay(day, today) ? " is-today" : ""}`, children: day.getDate() }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dshc-daylist", children: [
              list.slice(0, 3).map((occurrence) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Chip, { occurrence, onOpen }, occurrence.key)),
              list.length > 3 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "dshc-more", children: [
                "+",
                list.length - 3
              ] }) : null
            ] })
          ]
        },
        ymd(day)
      );
    })
  ] });
}
function Chip({ occurrence, onOpen }) {
  const { event } = occurrence;
  const color = COLORS[event.color ?? "blue"] ?? COLORS.blue;
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "button",
    {
      type: "button",
      className: `dshc-chip-event${event.done === true ? " is-done" : ""}`,
      style: { borderColor: color, background: `${color}1f` },
      title: `${event.title}${event.location !== void 0 ? ` · ${event.location}` : ""}`,
      onClick: (clickEvent) => {
        clickEvent.stopPropagation();
        onOpen(event);
      },
      children: [
        event.allDay ? null : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "dshc-chiptime", children: clockOf(event.start) }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "dshc-chiptitle", children: event.title })
      ]
    }
  );
}

// src/client/Plan.tsx
var import_react5 = require("react");
var import_jsx_runtime5 = require("react/jsx-runtime");
function daysLeft(due) {
  if (due === void 0 || due === "") return null;
  const target = (/* @__PURE__ */ new Date(`${due}T00:00`)).getTime();
  const today = /* @__PURE__ */ new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round((target - start) / 864e5);
}
function dueLabel(due) {
  const left = daysLeft(due);
  if (left === null) return null;
  if (left < 0) return t("已逾期 {n} 天", { n: Math.abs(left) });
  if (left === 0) return t("今天截止");
  if (left === 1) return t("明天截止");
  return t("还有 {n} 天", { n: left });
}
function progressOf(plan) {
  if (plan.milestones.length === 0) return plan.status === "done" ? 1 : 0;
  return plan.milestones.filter((milestone) => milestone.done).length / plan.milestones.length;
}
function PlanPage({ state, onSave, onDelete, onToggle }) {
  const t2 = useT();
  const [editing, setEditing] = (0, import_react5.useState)(null);
  const [openId, setOpenId] = (0, import_react5.useState)(null);
  const open = state.plans.find((plan) => plan.id === openId) ?? null;
  if (editing !== null) {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      PlanEditor,
      {
        initial: editing,
        onClose: () => setEditing(null),
        onSave: (plan) => {
          onSave(plan);
          setEditing(null);
        }
      }
    );
  }
  if (open !== null) {
    const progress = Math.round(progressOf(open) * 100);
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dshc-surface", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dshc-toolbar", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "dshc-btn", onClick: () => setOpenId(null), children: t2("‹ 全部目标") }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { marginLeft: "auto", display: "flex", gap: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "dshc-btn", onClick: () => setEditing(open), children: t2("编辑") }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            "button",
            {
              type: "button",
              className: "dshc-btn is-danger",
              onClick: () => {
                onDelete(open.id);
                setOpenId(null);
              },
              children: t2("删除")
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dshc-plan-head", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h2", { children: open.title }),
        open.goal !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "dshc-plan-goal", children: open.goal }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dshc-plan-meta", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: t2("{n}% 完成", { n: progress }) }),
          open.due !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: t2("截止 {date}", { date: open.due }) }) : null,
          dueLabel(open.due) !== null ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "dshc-plan-due", children: dueLabel(open.due) }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: t2("{done}/{total} 个里程碑", { done: open.milestones.filter((m) => m.done).length, total: open.milestones.length }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "dshc-bar", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("i", { style: { width: `${progress}%` } }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("ul", { className: "dshc-milestones", children: [
        open.milestones.map((milestone) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "dshc-milestone", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            "input",
            {
              type: "checkbox",
              checked: milestone.done,
              onChange: (e) => onToggle(open.id, milestone.id, e.target.checked)
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: milestone.done ? "dshc-milestone-title is-done" : "dshc-milestone-title", children: milestone.title }),
          milestone.due !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "dshc-milestone-due", children: milestone.due }) : null
        ] }) }, milestone.id)),
        open.milestones.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("li", { className: "dshc-hint", children: t2("还没有里程碑，点「编辑」把它们加进来。") }) : null
      ] })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dshc-surface", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dshc-toolbar", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("strong", { className: "dshc-heading", children: t2("长期目标") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        "button",
        {
          type: "button",
          className: "dshc-btn is-primary",
          style: { marginLeft: "auto" },
          onClick: () => setEditing({
            id: "",
            title: "",
            priority: "normal",
            status: "active",
            milestones: [],
            createdAt: 0,
            updatedAt: 0
          }),
          children: t2("+ 新建目标")
        }
      )
    ] }),
    state.plans.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dshc-empty", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("strong", { children: t2("还没有目标") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: t2("把一个长期任务拆成几个里程碑，进度就会一目了然。比如「期末复习」拆成三章 + 两套真题。") })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "dshc-planlist", children: state.plans.map((plan) => {
      const progress = Math.round(progressOf(plan) * 100);
      return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("button", { type: "button", className: "dshc-plancard", onClick: () => setOpenId(plan.id), children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dshc-plancard-top", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("strong", { children: plan.title }),
          plan.status === "done" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "dshc-tag", children: t2("已完成") }) : null,
          plan.priority === "high" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "dshc-tag is-hot", children: t2("重要") }) : null
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "dshc-bar", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("i", { style: { width: `${progress}%` } }) }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dshc-plan-meta", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { children: [
            progress,
            "%"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: t2("{done}/{total} 个里程碑", { done: plan.milestones.filter((m) => m.done).length, total: plan.milestones.length }) }),
          dueLabel(plan.due) !== null ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "dshc-plan-due", children: dueLabel(plan.due) }) : null
        ] })
      ] }, plan.id);
    }) })
  ] });
}
function PlanEditor({ initial, onClose, onSave }) {
  const t2 = useT();
  const [title, setTitle] = (0, import_react5.useState)(initial.title);
  const [goal, setGoal] = (0, import_react5.useState)(initial.goal ?? "");
  const [due, setDue] = (0, import_react5.useState)(initial.due ?? "");
  const [priority, setPriority] = (0, import_react5.useState)(initial.priority);
  const [milestones, setMilestones] = (0, import_react5.useState)(() => initial.milestones.map((m) => ({ ...m })));
  const [draftTitle, setDraftTitle] = (0, import_react5.useState)("");
  const [error, setError] = (0, import_react5.useState)(null);
  const addMilestone = () => {
    if (draftTitle.trim() === "") return;
    setMilestones((current2) => [
      ...current2,
      { id: `tmp-${Date.now()}-${current2.length}`, title: draftTitle.trim(), done: false }
    ]);
    setDraftTitle("");
  };
  const submit = () => {
    if (title.trim() === "") {
      setError(t2("请填写目标名称"));
      return;
    }
    onSave({
      ...initial.id !== "" ? { id: initial.id } : {},
      title: title.trim(),
      goal: goal.trim() === "" ? void 0 : goal.trim(),
      due: due === "" ? void 0 : due,
      priority,
      status: initial.status,
      milestones
    });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "dshc-backdrop", role: "presentation", onMouseDown: (e) => e.target === e.currentTarget && onClose(), children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dshc-modal", role: "dialog", "aria-modal": "true", "aria-label": initial.id === "" ? t2("新建目标") : t2("编辑目标"), children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("header", { className: "dshc-modal-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("strong", { children: initial.id === "" ? t2("新建目标") : t2("编辑目标") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "dshc-icon-btn", onClick: onClose, "aria-label": t2("关闭"), children: "✕" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dshc-modal-body", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "dshc-field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: t2("目标") }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("input", { type: "text", value: title, placeholder: t2("例如：期末复习完高数"), onChange: (e) => setTitle(e.target.value) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "dshc-field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: t2("说明") }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("textarea", { rows: 2, value: goal, placeholder: t2("选填：为什么要做、做到什么程度算完成"), onChange: (e) => setGoal(e.target.value) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dshc-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "dshc-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: t2("截止日") }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("input", { type: "date", value: due, onChange: (e) => setDue(e.target.value) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "dshc-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: t2("优先级") }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("select", { value: priority, onChange: (e) => setPriority(e.target.value), children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: "low", children: t2("低") }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: "normal", children: t2("普通") }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: "high", children: t2("重要") })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dshc-field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: t2("里程碑") }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("ul", { className: "dshc-milestones", children: milestones.map((milestone) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dshc-milestone-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            "input",
            {
              type: "text",
              value: milestone.title,
              onChange: (e) => setMilestones(
                (current2) => current2.map((item) => item.id === milestone.id ? { ...item, title: e.target.value } : item)
              )
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            "input",
            {
              type: "date",
              value: milestone.due ?? "",
              onChange: (e) => setMilestones(
                (current2) => current2.map(
                  (item) => item.id === milestone.id ? { ...item, due: e.target.value === "" ? void 0 : e.target.value } : item
                )
              )
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            "button",
            {
              type: "button",
              className: "dshc-icon-btn",
              "aria-label": t2("删除里程碑"),
              onClick: () => setMilestones((current2) => current2.filter((item) => item.id !== milestone.id)),
              children: "✕"
            }
          )
        ] }) }, milestone.id)) }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dshc-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            "input",
            {
              type: "text",
              placeholder: t2("加一个里程碑，回车确认"),
              value: draftTitle,
              onChange: (e) => setDraftTitle(e.target.value),
              onKeyDown: (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addMilestone();
                }
              },
              style: {
                flex: 1,
                border: "1px solid var(--dshc-border)",
                borderRadius: 8,
                padding: "6px 9px",
                background: "var(--dshc-bg)",
                color: "var(--dshc-text)",
                fontSize: 13
              }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "dshc-btn", onClick: addMilestone, children: t2("添加") })
        ] })
      ] }),
      error !== null ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "dshc-error", children: error }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("footer", { className: "dshc-modal-foot", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: { marginLeft: "auto" } }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "dshc-btn", onClick: onClose, children: t2("取消") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "dshc-btn is-primary", onClick: submit, children: t2("保存") })
    ] })
  ] }) });
}

// src/client/QuickAdd.tsx
var import_react6 = require("react");
var import_jsx_runtime6 = require("react/jsx-runtime");
function QuickAdd({ onImport }) {
  const t2 = useT();
  const [text, setText] = (0, import_react6.useState)("");
  const [busy, setBusy] = (0, import_react6.useState)(false);
  const [error, setError] = (0, import_react6.useState)(null);
  const [preview, setPreview] = (0, import_react6.useState)(null);
  const parse = async () => {
    const sentence = text.trim();
    if (sentence === "" || busy) return;
    setBusy(true);
    setError(null);
    try {
      setPreview(await call("parse.events", { text: sentence }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      setPreview(null);
    } finally {
      setBusy(false);
    }
  };
  const confirm = () => {
    if (preview === null) return;
    onImport(preview.events);
    setPreview(null);
    setText("");
  };
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "dshc-quick", children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "dshc-quick-row", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        "input",
        {
          type: "text",
          value: text,
          placeholder: t2("一句话添加，例如：明天下午三点组会，提前十分钟提醒"),
          onChange: (e) => setText(e.target.value),
          onKeyDown: (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void parse();
            }
            if (e.key === "Escape") setPreview(null);
          },
          disabled: busy
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", className: "dshc-btn is-primary", onClick: () => void parse(), disabled: busy || text.trim() === "", children: busy ? t2("解析中…") : t2("解析") })
    ] }),
    error !== null ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: "dshc-error", children: [
      error,
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", className: "dshc-link", onClick: () => void parse(), children: t2("重试") })
    ] }) : null,
    preview !== null ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "dshc-preview", role: "group", "aria-label": t2("解析结果"), children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "dshc-preview-head", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: t2("识别到 {n} 条日程 · 由 {model} 解析", { n: preview.events.length, model: preview.model }) }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { marginLeft: "auto", display: "flex", gap: 6 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", className: "dshc-btn", onClick: () => setPreview(null), children: t2("取消") }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", className: "dshc-btn is-primary", onClick: confirm, children: t2("全部添加") })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("ul", { className: "dshc-preview-list", children: preview.events.map((event) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("li", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: event.title }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { children: [
          event.start.slice(0, 10),
          " ",
          event.allDay ? t2("全天") : clockOf(event.start),
          event.allDay ? "" : `–${clockOf(event.end)}`
        ] }),
        event.location !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "dshc-hint", children: event.location }) : null,
        event.repeat !== void 0 && event.repeat.kind !== "none" ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "dshc-tag", children: t2("重复") }) : null
      ] }, event.id)) }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "dshc-hint", children: t2("解析结果先预览再落库；有问题就改一下措辞重新解析。") })
    ] }) : null
  ] });
}

// src/client/Settings.tsx
var import_react7 = require("react");

// src/client/io.ts
function downloadText(filename, text, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2e3);
}
function pickTextFile(accept = ".ics,.json,.txt,text/calendar,application/json") {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.style.display = "none";
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      input.remove();
      if (file === void 0) {
        resolve(null);
        return;
      }
      file.text().then((text) => resolve({ name: file.name, text })).catch(() => resolve(null));
    });
    document.body.appendChild(input);
    input.click();
  });
}
function stampedName(extension) {
  const now = /* @__PURE__ */ new Date();
  const pad2 = (n) => String(n).padStart(2, "0");
  return `schedule-${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}.${extension}`;
}

// src/client/Settings.tsx
var import_jsx_runtime7 = require("react/jsx-runtime");
function notificationState() {
  try {
    if (typeof Notification === "undefined") return "unsupported";
    return Notification.permission === "granted" ? "ok" : Notification.permission === "denied" ? "denied" : "unsupported";
  } catch {
    return "unsupported";
  }
}
function SettingsPanel({ state, onClose, onSettings, onTerm, onReload }) {
  const t2 = useT();
  const [term, setTerm] = (0, import_react7.useState)(() => ({ ...state.term, periods: state.term.periods.map((p) => ({ ...p })) }));
  const [notifyAsked, setNotifyAsked] = (0, import_react7.useState)(false);
  const [ioBusy, setIoBusy] = (0, import_react7.useState)(false);
  const [ioMessage, setIoMessage] = (0, import_react7.useState)(null);
  (0, import_react7.useEffect)(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const patchPeriod = (index, next) => setTerm((current2) => ({ ...current2, periods: current2.periods.map((p) => p.index === index ? { ...p, ...next } : p) }));
  const addPeriod = () => setTerm((current2) => ({
    ...current2,
    periods: [...current2.periods, { index: (current2.periods.at(-1)?.index ?? 0) + 1, start: "08:00", end: "08:45" }]
  }));
  const removePeriod = (index) => setTerm((current2) => ({ ...current2, periods: current2.periods.filter((p) => p.index !== index) }));
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "dshc-backdrop", role: "presentation", onMouseDown: (e) => e.target === e.currentTarget && onClose(), children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshc-modal", role: "dialog", "aria-modal": "true", "aria-label": t2("设置"), children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("header", { className: "dshc-modal-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("strong", { children: t2("设置") }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: "dshc-icon-btn", onClick: onClose, "aria-label": t2("关闭"), children: "✕" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshc-modal-body", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { className: "dshc-section", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h3", { children: t2("课表") }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("label", { className: "dshc-switch", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
            "input",
            {
              type: "checkbox",
              checked: state.settings.timetableEnabled,
              onChange: (e) => void onSettings({ timetableEnabled: e.target.checked })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: t2("启用课表（关闭后左侧栏不再显示课表页）") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshc-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("label", { className: "dshc-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: t2("开学第一周的周一") }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
              "input",
              {
                type: "date",
                value: term.startDate,
                onChange: (e) => setTerm({ ...term, startDate: e.target.value }),
                onBlur: () => void onTerm({ startDate: term.startDate })
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("label", { className: "dshc-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: t2("总周数") }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
              "input",
              {
                type: "number",
                min: 1,
                max: 60,
                value: term.totalWeeks,
                onChange: (e) => setTerm({ ...term, totalWeeks: Number(e.target.value) }),
                onBlur: () => void onTerm({ totalWeeks: term.totalWeeks })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshc-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: t2("节次时间") }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "dshc-periods", children: term.periods.map((period) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshc-period", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "dshc-period-index", children: t2("第 {n} 节", { n: period.index }) }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("input", { type: "time", value: period.start, onChange: (e) => patchPeriod(period.index, { start: e.target.value }) }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: "–" }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("input", { type: "time", value: period.end, onChange: (e) => patchPeriod(period.index, { end: e.target.value }) }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: "dshc-icon-btn", "aria-label": t2("删除第 {n} 节", { n: period.index }), onClick: () => removePeriod(period.index), children: "✕" })
          ] }, period.index)) }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshc-chips", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: "dshc-chip", onClick: addPeriod, children: t2("+ 增加一节") }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: "dshc-btn is-primary", onClick: () => void onTerm(term), children: t2("保存节次") })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { className: "dshc-section", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h3", { children: t2("提醒") }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("label", { className: "dshc-switch", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
            "input",
            {
              type: "checkbox",
              checked: state.settings.soundEnabled,
              onChange: (e) => void onSettings({ soundEnabled: e.target.checked })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: t2("提醒时播放提示音") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("label", { className: "dshc-switch", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
            "input",
            {
              type: "checkbox",
              checked: state.settings.systemNotification,
              onChange: async (e) => {
                const on = e.target.checked;
                if (on && !notifyAsked) {
                  setNotifyAsked(true);
                  await ensureNotificationPermission();
                }
                void onSettings({ systemNotification: on });
              }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: t2("同时发系统通知（DSH 最小化时也能看到）") })
        ] }),
        notificationState() !== "ok" ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "dshc-hint", children: t2("当前环境没有系统通知权限，到点仍会弹出应用内提醒。") }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("label", { className: "dshc-switch", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
            "input",
            {
              type: "checkbox",
              checked: state.settings.quietHours.enabled,
              onChange: (e) => void onSettings({ quietHours: { ...state.settings.quietHours, enabled: e.target.checked } })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: t2("免打扰时段") })
        ] }),
        state.settings.quietHours.enabled ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshc-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("label", { className: "dshc-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: t2("从") }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
              "input",
              {
                type: "time",
                value: state.settings.quietHours.from,
                onChange: (e) => void onSettings({ quietHours: { ...state.settings.quietHours, from: e.target.value } })
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("label", { className: "dshc-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: t2("到") }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
              "input",
              {
                type: "time",
                value: state.settings.quietHours.to,
                onChange: (e) => void onSettings({ quietHours: { ...state.settings.quietHours, to: e.target.value } })
              }
            )
          ] })
        ] }) : null
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { className: "dshc-section", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h3", { children: t2("日历") }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshc-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("label", { className: "dshc-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: t2("每周从") }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
              "select",
              {
                value: String(state.settings.weekStart),
                onChange: (e) => void onSettings({ weekStart: Number(e.target.value) === 7 ? 7 : 1 }),
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: "1", children: t2("周一开始") }),
                  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: "7", children: t2("周日开始") })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("label", { className: "dshc-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: t2("新建日程默认提前提醒") }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
              "select",
              {
                value: String(state.settings.defaultRemindBefore),
                onChange: (e) => void onSettings({ defaultRemindBefore: Number(e.target.value) }),
                children: [0, 5, 10, 15, 30, 60].map((minutes) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: String(minutes), children: minutes === 0 ? t2("准时提醒") : t2("{n} 分钟", { n: minutes }) }, minutes))
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("p", { className: "dshc-hint", children: [
          t2("数据文件："),
          `<DSH_HOME>/storages/dsh-schedule-calendar/calendar.json`
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { className: "dshc-section", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h3", { children: t2("数据") }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshc-chips", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
            "button",
            {
              type: "button",
              className: "dshc-btn",
              disabled: ioBusy,
              onClick: async () => {
                setIoBusy(true);
                try {
                  const reply = await call("io.export.ics");
                  downloadText(stampedName("ics"), reply.text, "text/calendar;charset=utf-8");
                  setIoMessage(t2("已导出 {n} 条日程为 ICS", { n: reply.count }));
                } catch (cause) {
                  setIoMessage(cause instanceof Error ? cause.message : String(cause));
                } finally {
                  setIoBusy(false);
                }
              },
              children: t2("导出 ICS")
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
            "button",
            {
              type: "button",
              className: "dshc-btn",
              disabled: ioBusy,
              onClick: async () => {
                const file = await pickTextFile(".ics,.txt,text/calendar");
                if (file === null) return;
                setIoBusy(true);
                try {
                  const reply = await call("io.import.ics", { text: file.text });
                  setIoMessage(t2("从 {file} 导入 {n} 条", { file: file.name, n: reply.added }) + (reply.skipped > 0 ? t2("，跳过 {n} 条", { n: reply.skipped }) : ""));
                  await onReload();
                } catch (cause) {
                  setIoMessage(cause instanceof Error ? cause.message : String(cause));
                } finally {
                  setIoBusy(false);
                }
              },
              children: t2("导入 ICS")
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
            "button",
            {
              type: "button",
              className: "dshc-btn",
              disabled: ioBusy,
              onClick: async () => {
                setIoBusy(true);
                try {
                  const reply = await call("io.backup");
                  downloadText(stampedName("json"), reply.json, "application/json;charset=utf-8");
                  setIoMessage(t2("已导出 JSON 备份"));
                } catch (cause) {
                  setIoMessage(cause instanceof Error ? cause.message : String(cause));
                } finally {
                  setIoBusy(false);
                }
              },
              children: t2("导出备份")
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
            "button",
            {
              type: "button",
              className: "dshc-btn is-danger",
              disabled: ioBusy,
              onClick: async () => {
                const file = await pickTextFile(".json,application/json");
                if (file === null) return;
                if (!window.confirm(t2("恢复备份会覆盖当前的日程、课表和目标，确定继续？"))) return;
                setIoBusy(true);
                try {
                  await call("io.restore", { json: file.text });
                  setIoMessage(t2("已从 {file} 恢复", { file: file.name }));
                  await onReload();
                } catch (cause) {
                  setIoMessage(cause instanceof Error ? cause.message : String(cause));
                } finally {
                  setIoBusy(false);
                }
              },
              children: t2("恢复备份")
            }
          )
        ] }),
        ioMessage !== null ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "dshc-hint", children: ioMessage }) : null
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("footer", { className: "dshc-modal-foot", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: "dshc-btn is-primary", style: { marginLeft: "auto" }, onClick: onClose, children: t2("完成") }) })
  ] }) });
}

// src/client/Timetable.tsx
var import_react8 = require("react");

// src/client/csv.ts
var WEEKDAY_WORDS = {
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  日: 7,
  天: 7,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
  sun: 7,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7
};
function parseWeekday(value) {
  const text = value.trim().toLowerCase().replace(/^周|^星期|^礼拜/, "");
  if (text === "") return null;
  return WEEKDAY_WORDS[text] ?? WEEKDAY_WORDS[text.slice(0, 3)] ?? null;
}
function parseParity(value) {
  const text = value.trim().toLowerCase();
  if (text === "" || text === "all" || text === "每周" || text === "全") return "all";
  if (text.includes("单") || text === "odd") return "odd";
  if (text.includes("双") || text === "even") return "even";
  return "all";
}
function splitLine(line) {
  const out = [];
  let current2 = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current2 += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if ((char === "," || char === "	") && !quoted) {
      out.push(current2.trim());
      current2 = "";
      continue;
    }
    current2 += char;
  }
  out.push(current2.trim());
  return out;
}
function parseCourseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  const courses = [];
  const skipped = [];
  for (const [index, line] of lines.entries()) {
    const cells = splitLine(line);
    if (index === 0 && /名称|course|课程/i.test(cells[0] ?? "")) continue;
    if (cells.length < 4) {
      skipped.push(line);
      continue;
    }
    const [name = "", teacher = "", location = "", weekdayCell = "", startCell = "", endCell = "", fromCell = "", toCell = "", parityCell = ""] = cells;
    const weekday = parseWeekday(weekdayCell);
    const startPeriod = Number.parseInt(startCell, 10);
    const endPeriod = Number.parseInt(endCell === "" ? startCell : endCell, 10);
    const from = fromCell === "" ? 1 : Number.parseInt(fromCell, 10);
    const to = toCell === "" ? 20 : Number.parseInt(toCell, 10);
    if (name === "" || weekday === null || !Number.isInteger(startPeriod) || !Number.isInteger(endPeriod)) {
      skipped.push(line);
      continue;
    }
    const periods = [];
    for (let p = Math.min(startPeriod, endPeriod); p <= Math.max(startPeriod, endPeriod); p += 1) periods.push(p);
    courses.push({
      name,
      teacher: teacher === "" ? void 0 : teacher,
      location: location === "" ? void 0 : location,
      weekday,
      periods,
      weeks: { from: Number.isInteger(from) && from > 0 ? from : 1, to: Number.isInteger(to) && to > 0 ? to : 20 },
      parity: parseParity(parityCell)
    });
  }
  return { courses, skipped };
}
var CSV_TEMPLATE = `课程名称,教师,地点,星期,开始节,结束节,起始周,结束周,单双周
高等数学,张老师,教三-401,周一,1,2,1,16,每周
大学物理,李老师,理科楼-205,周三,3,4,1,16,单周
`;

// src/client/Timetable.tsx
var import_jsx_runtime8 = require("react/jsx-runtime");
var WEEKDAY_NAMES = ["一", "二", "三", "四", "五", "六", "日"];
var PARITIES = [
  { value: "all", label: "每周" },
  { value: "odd", label: "单周" },
  { value: "even", label: "双周" }
];
function weekOf(termStart, date) {
  const start = parseLocal(termStart);
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.round((day.getTime() - start.getTime()) / 864e5);
  return Math.floor(diff / 7) + 1;
}
function runsInWeek(course, week) {
  if (week < course.weeks.from || week > course.weeks.to) return false;
  if (course.parity === "odd" && week % 2 === 0) return false;
  if (course.parity === "even" && week % 2 === 1) return false;
  return true;
}
function Timetable({ state, onSaveCourse, onDeleteCourse, onImport, onAiParse, onEnable }) {
  const today = (0, import_react8.useMemo)(() => /* @__PURE__ */ new Date(), []);
  const t2 = useT();
  const wd = (day) => language() === "en" ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][day - 1] ?? "D" + day : "周" + WEEKDAY_NAMES[day - 1];
  const currentWeek = weekOf(state.term.startDate, today);
  const [week, setWeek] = (0, import_react8.useState)(() => Math.min(Math.max(1, currentWeek), state.term.totalWeeks));
  const [editing, setEditing] = (0, import_react8.useState)(null);
  const [importing, setImporting] = (0, import_react8.useState)(false);
  if (!state.settings.timetableEnabled) {
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "dshc-empty", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: t2("课表未启用") }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: t2("启用后可以按学期周次查看课程，并支持粘贴文本、手动录入或导入 CSV。") }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: "dshc-btn is-primary", onClick: onEnable, children: t2("启用课表") })
    ] });
  }
  const periods = state.term.periods;
  const days = state.term.days.length > 0 ? state.term.days : [1, 2, 3, 4, 5, 6, 7];
  const visible = state.courses.filter((course) => runsInWeek(course, week));
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "dshc-surface", children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "dshc-toolbar", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: "dshc-icon-btn", "aria-label": t2("上一周"), onClick: () => setWeek((w) => Math.max(1, w - 1)), children: "‹" }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: "dshc-btn", onClick: () => setWeek(Math.min(Math.max(1, currentWeek), state.term.totalWeeks)), children: t2("本周") }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: "dshc-icon-btn", "aria-label": t2("下一周"), onClick: () => setWeek((w) => Math.min(state.term.totalWeeks, w + 1)), children: "›" }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { className: "dshc-heading", children: t2("第 {n} 周", { n: week }) }),
      currentWeek !== week && currentWeek >= 1 && currentWeek <= state.term.totalWeeks ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "dshc-hint", children: t2("（本周是第 {n} 周）", { n: currentWeek }) }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { marginLeft: "auto", display: "flex", gap: 8 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: "dshc-btn", onClick: () => setImporting(true), children: t2("导入") }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
          "button",
          {
            type: "button",
            className: "dshc-btn is-primary",
            onClick: () => setEditing({ course: null, weekday: days[0] ?? 1, period: periods[0]?.index ?? 1 }),
            children: [
              "+ ",
              t2("添加课程")
            ]
          }
        )
      ] })
    ] }),
    periods.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "dshc-empty", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: t2("还没有节次时间") }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: t2("先到设置里配置每天第几节几点上课，课表格子才能排出来。") })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "dshc-tt", style: { gridTemplateColumns: `72px repeat(${days.length}, minmax(0, 1fr))` }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "dshc-tt-corner", children: t2("节次") }),
      days.map((day) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "dshc-tt-head", children: wd(day) }, day)),
      periods.map((period, rowIndex) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { display: "contents" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "dshc-tt-time", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: period.index }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { children: [
            period.start,
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("br", {}),
            period.end
          ] })
        ] }),
        days.map((day) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          "button",
          {
            type: "button",
            className: "dshc-tt-cell",
            style: { gridRow: rowIndex + 2, gridColumn: days.indexOf(day) + 2 },
            "aria-label": t2("第 {n} 节", { n: period.index }) + " " + wd(day),
            onClick: () => setEditing({ course: null, weekday: day, period: period.index })
          },
          `c${period.index}-${day}`
        ))
      ] }, `r${period.index}`)),
      visible.map((course) => {
        const first = Math.min(...course.periods);
        const rowIndex = periods.findIndex((period) => period.index === first);
        if (rowIndex < 0) return null;
        const span = Math.max(1, course.periods.length);
        const color = COLORS[course.color ?? "blue"] ?? COLORS.blue;
        return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
          "button",
          {
            type: "button",
            className: "dshc-tt-course",
            style: {
              gridRow: `${rowIndex + 2} / span ${span}`,
              gridColumn: days.indexOf(course.weekday) + 2,
              borderColor: color,
              background: `${color}1f`
            },
            onClick: () => setEditing({ course, weekday: course.weekday, period: first }),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: course.name }),
              course.location !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: course.location }) : null,
              course.teacher !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: course.teacher }) : null
            ]
          },
          course.id
        );
      })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "dshc-hint", children: t2("本学期共 {total} 周，已录入 {courses} 门课程，本周显示 {visible} 门。", { total: state.term.totalWeeks, courses: state.courses.length, visible: visible.length }) }),
    editing !== null ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
      CourseEditor,
      {
        initial: editing.course,
        weekday: editing.weekday,
        period: editing.period,
        term: state.term,
        onClose: () => setEditing(null),
        onSave: (course) => {
          onSaveCourse(course);
          setEditing(null);
        },
        onDelete: (id) => {
          onDeleteCourse(id);
          setEditing(null);
        }
      }
    ) : null,
    importing ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
      ImportDialog,
      {
        onClose: () => setImporting(false),
        onAiParse,
        onImport: (courses, replace) => {
          onImport(courses, replace);
          setImporting(false);
        }
      }
    ) : null
  ] });
}
function CourseEditor({ initial, weekday, period, term, onClose, onSave, onDelete }) {
  const t2 = useT();
  const wd = (day) => language() === "en" ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][day - 1] ?? "D" + day : "周" + WEEKDAY_NAMES[day - 1];
  const [draft, setDraft] = (0, import_react8.useState)({
    name: initial?.name ?? "",
    teacher: initial?.teacher ?? "",
    location: initial?.location ?? "",
    weekday: initial?.weekday ?? weekday,
    from: initial?.periods[0] ?? period,
    to: initial?.periods.at(-1) ?? period,
    weekFrom: initial?.weeks.from ?? 1,
    weekTo: initial?.weeks.to ?? term.totalWeeks,
    parity: initial?.parity ?? "all",
    color: initial?.color ?? "blue"
  });
  const [error, setError] = (0, import_react8.useState)(null);
  const patch = (next) => setDraft((current2) => ({ ...current2, ...next }));
  const submit = () => {
    if (draft.name.trim() === "") {
      setError(t2("请填写课程名称"));
      return;
    }
    const from = Math.min(draft.from, draft.to);
    const to = Math.max(draft.from, draft.to);
    const periods = [];
    for (let p = from; p <= to; p += 1) periods.push(p);
    onSave({
      ...initial ?? {},
      name: draft.name.trim(),
      teacher: draft.teacher.trim() === "" ? void 0 : draft.teacher.trim(),
      location: draft.location.trim() === "" ? void 0 : draft.location.trim(),
      weekday: draft.weekday,
      periods,
      weeks: { from: Math.min(draft.weekFrom, draft.weekTo), to: Math.max(draft.weekFrom, draft.weekTo) },
      parity: draft.parity,
      color: draft.color
    });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "dshc-backdrop", role: "presentation", onMouseDown: (e) => e.target === e.currentTarget && onClose(), children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "dshc-modal", role: "dialog", "aria-modal": "true", "aria-label": initial === null ? t2("添加课程") : t2("编辑课程"), children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("header", { className: "dshc-modal-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: initial === null ? t2("添加课程") : t2("编辑课程") }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: "dshc-icon-btn", onClick: onClose, "aria-label": t2("关闭"), children: "✕" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "dshc-modal-body", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { className: "dshc-field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: t2("课程名称") }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          "input",
          {
            type: "text",
            value: draft.name,
            placeholder: t2("例如：高等数学"),
            onChange: (e) => patch({ name: e.target.value })
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "dshc-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { className: "dshc-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: t2("教师") }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { type: "text", value: draft.teacher, onChange: (e) => patch({ teacher: e.target.value }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { className: "dshc-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: t2("地点") }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { type: "text", value: draft.location, onChange: (e) => patch({ location: e.target.value }) })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "dshc-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { className: "dshc-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: t2("星期") }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("select", { value: draft.weekday, onChange: (e) => patch({ weekday: Number(e.target.value) }), children: [1, 2, 3, 4, 5, 6, 7].map((day) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: day, children: wd(day) }, day)) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { className: "dshc-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: t2("起始节") }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("select", { value: draft.from, onChange: (e) => patch({ from: Number(e.target.value) }), children: term.periods.map((p) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: p.index, children: t2("第 {n} 节", { n: p.index }) }, p.index)) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { className: "dshc-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: t2("结束节") }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("select", { value: draft.to, onChange: (e) => patch({ to: Number(e.target.value) }), children: term.periods.map((p) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: p.index, children: t2("第 {n} 节", { n: p.index }) }, p.index)) })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "dshc-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { className: "dshc-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: t2("起始周") }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { type: "number", min: 1, max: 60, value: draft.weekFrom, onChange: (e) => patch({ weekFrom: Number(e.target.value) }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { className: "dshc-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: t2("结束周") }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { type: "number", min: 1, max: 60, value: draft.weekTo, onChange: (e) => patch({ weekTo: Number(e.target.value) }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { className: "dshc-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: t2("单双周") }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("select", { value: draft.parity, onChange: (e) => patch({ parity: e.target.value }), children: PARITIES.map((option) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: option.value, children: t2(option.label) }, option.value)) })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "dshc-field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: t2("颜色") }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "dshc-chips", children: Object.entries(COLORS).map(([key, hex]) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          "button",
          {
            type: "button",
            className: `dshc-swatch${draft.color === key ? " is-on" : ""}`,
            style: { background: hex },
            "aria-label": key,
            "aria-pressed": draft.color === key,
            onClick: () => patch({ color: key })
          },
          key
        )) })
      ] }),
      error !== null ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "dshc-error", children: error }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("footer", { className: "dshc-modal-foot", children: [
      initial !== null ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: "dshc-btn is-danger", onClick: () => onDelete(initial.id), children: t2("删除") }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { style: { marginLeft: "auto" } }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: "dshc-btn", onClick: onClose, children: t2("取消") }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: "dshc-btn is-primary", onClick: submit, children: t2("保存") })
    ] })
  ] }) });
}
function ImportDialog({ onClose, onImport, onAiParse }) {
  const t2 = useT();
  const [text, setText] = (0, import_react8.useState)("");
  const [replace, setReplace] = (0, import_react8.useState)(false);
  const [error, setError] = (0, import_react8.useState)(null);
  const [ai, setAi] = (0, import_react8.useState)(null);
  const [busy, setBusy] = (0, import_react8.useState)(false);
  const fileRef = (0, import_react8.useRef)(null);
  const csv = (0, import_react8.useMemo)(() => text.trim() === "" ? null : parseCourseCsv(text), [text]);
  const courses = ai?.courses ?? csv?.courses ?? [];
  const skipped = ai === null ? csv?.skipped.length ?? 0 : 0;
  const pick = async (file) => {
    if (file === void 0) return;
    try {
      setText(await file.text());
      setAi(null);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };
  const runAi = async () => {
    if (text.trim() === "" || busy) return;
    setBusy(true);
    setError(null);
    try {
      const reply = await onAiParse(text);
      setAi(reply);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "dshc-backdrop", role: "presentation", onMouseDown: (e) => e.target === e.currentTarget && onClose(), children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "dshc-modal", role: "dialog", "aria-modal": "true", "aria-label": t2("导入课表"), children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("header", { className: "dshc-modal-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: t2("导入课表") }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: "dshc-icon-btn", onClick: onClose, "aria-label": t2("关闭"), children: "✕" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "dshc-modal-body", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "dshc-hint", children: t2("三种方式任选：让 AI 解析你粘贴的课表文字、选择教务系统导出的 CSV 文件，或按下面的列顺序自己排版。") }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "dshc-chips", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: "dshc-btn", onClick: () => void fileRef.current?.click(), children: t2("选择 CSV 文件") }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: "dshc-btn", onClick: () => void runAi(), disabled: busy || text.trim() === "", children: busy ? t2("解析中…") : t2("AI 解析这段文本") }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          "button",
          {
            type: "button",
            className: "dshc-chip",
            onClick: () => {
              setText(CSV_TEMPLATE);
              setAi(null);
            },
            children: t2("填入示例")
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          "input",
          {
            ref: fileRef,
            type: "file",
            accept: ".csv,.tsv,.txt,text/csv,text/plain",
            style: { display: "none" },
            onChange: (e) => void pick(e.target.files?.[0])
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { className: "dshc-field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: t2("粘贴内容") }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          "textarea",
          {
            rows: 7,
            value: text,
            placeholder: t2("也可以直接贴教务系统复制的课表文字，再点「AI 解析」"),
            onChange: (e) => {
              setText(e.target.value);
              setAi(null);
            }
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("details", { className: "dshc-details", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("summary", { children: t2("CSV 列格式") }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("pre", { className: "dshc-pre", children: CSV_TEMPLATE })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { className: "dshc-switch", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { type: "checkbox", checked: replace, onChange: (e) => setReplace(e.target.checked) }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: t2("覆盖已有课程（不勾选则追加）") })
      ] }),
      courses.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("p", { className: "dshc-hint", children: [
        ai !== null ? t2("由 {model} 解析出 {n} 门课程", { model: ai.model, n: courses.length }) : t2("识别到 {n} 门课程", { n: courses.length }),
        skipped > 0 ? t2("，{n} 行无法识别", { n: skipped }) : ""
      ] }) : null,
      error !== null ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "dshc-error", children: error }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("footer", { className: "dshc-modal-foot", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { style: { marginLeft: "auto" } }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: "dshc-btn", onClick: onClose, children: t2("取消") }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
        "button",
        {
          type: "button",
          className: "dshc-btn is-primary",
          disabled: courses.length === 0,
          onClick: () => {
            if (courses.length > 0) onImport(courses, replace);
          },
          children: [
            t2("导入"),
            " ",
            courses.length,
            " 门"
          ]
        }
      )
    ] })
  ] }) });
}

// src/client/Page.tsx
var import_jsx_runtime9 = require("react/jsx-runtime");
function uiLocale() {
  try {
    return document.documentElement.lang || navigator.language || "zh-CN";
  } catch {
    return "zh-CN";
  }
}
function CalendarPage() {
  const [tab, setTab] = (0, import_react9.useState)("calendar");
  const [state, setState] = (0, import_react9.useState)(null);
  const [error, setError] = (0, import_react9.useState)(null);
  const [editor, setEditor] = (0, import_react9.useState)(null);
  const [settingsOpen, setSettingsOpen] = (0, import_react9.useState)(false);
  const [busy, setBusy] = (0, import_react9.useState)(false);
  const locale = (0, import_react9.useMemo)(uiLocale, []);
  const t2 = useT();
  const reload = (0, import_react9.useCallback)(async () => {
    try {
      setState(await call("state.get"));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }, []);
  (0, import_react9.useEffect)(() => {
    void reload();
  }, [reload]);
  (0, import_react9.useEffect)(() => {
    let alive = true;
    let seen = -1;
    const check = async () => {
      try {
        const { revision } = await call("state.rev");
        if (!alive) return;
        if (seen === -1) {
          seen = revision;
          return;
        }
        if (revision !== seen) {
          seen = revision;
          await reload();
        }
      } catch {
      }
    };
    void check();
    const timer = setInterval(() => void check(), 6e3);
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [reload]);
  const mutate = (0, import_react9.useCallback)(async (method, body) => {
    setBusy(true);
    try {
      setState(await call(method, body));
      setError(null);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      return false;
    } finally {
      setBusy(false);
    }
  }, []);
  const saveEvent = (0, import_react9.useCallback)(
    async (event) => {
      if (await mutate("event.save", { event })) setEditor(null);
    },
    [mutate]
  );
  const deleteEvent = (0, import_react9.useCallback)(
    async (id) => {
      if (await mutate("event.delete", { id })) setEditor(null);
    },
    [mutate]
  );
  const importEvents = (0, import_react9.useCallback)(
    async (events) => {
      await mutate("event.import", { events });
    },
    [mutate]
  );
  const saveSettings = (0, import_react9.useCallback)(
    async (patch) => {
      await mutate("settings.update", { patch });
    },
    [mutate]
  );
  const saveTerm = (0, import_react9.useCallback)(
    async (term) => {
      await mutate("term.update", { term });
    },
    [mutate]
  );
  const saveCourse = (0, import_react9.useCallback)(
    async (course) => {
      await mutate("course.save", { course });
    },
    [mutate]
  );
  const deleteCourse = (0, import_react9.useCallback)(
    async (id) => {
      await mutate("course.delete", { id });
    },
    [mutate]
  );
  const importCourses = (0, import_react9.useCallback)(
    async (courses, replace) => {
      await mutate("course.import", { courses, replace });
    },
    [mutate]
  );
  const parseTimetable = (0, import_react9.useCallback)(async (text) => await call("parse.timetable", { text }), []);
  const savePlan = (0, import_react9.useCallback)(
    async (plan) => {
      await mutate("plan.save", { plan });
    },
    [mutate]
  );
  const deletePlan = (0, import_react9.useCallback)(
    async (id) => {
      await mutate("plan.delete", { id });
    },
    [mutate]
  );
  const toggleMilestone = (0, import_react9.useCallback)(
    async (planId, milestoneId, done) => {
      await mutate("plan.milestone", { planId, milestoneId, done });
    },
    [mutate]
  );
  const timetableOn = state?.settings.timetableEnabled === true;
  const showTimetableTab = timetableOn || tab === "timetable";
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "dshc-root", children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("header", { className: "dshc-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h1", { className: "dshc-title", children: t2("日程") }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "dshc-tabs", role: "tablist", "aria-label": t2("日程"), children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { type: "button", className: "dshc-tab", role: "tab", "aria-selected": tab === "calendar", onClick: () => setTab("calendar"), children: t2("日历") }),
        showTimetableTab ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { type: "button", className: "dshc-tab", role: "tab", "aria-selected": tab === "timetable", onClick: () => setTab("timetable"), children: t2("课表") }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { type: "button", className: "dshc-tab", role: "tab", "aria-selected": tab === "plan", onClick: () => setTab("plan"), children: t2("规划") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { type: "button", className: "dshc-icon-btn", "aria-label": t2("设置"), title: t2("设置"), onClick: () => setSettingsOpen(true), children: "⚙" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "dshc-body", children: [
      error !== null ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "dshc-error", children: error }) : null,
      state === null && error === null ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "dshc-empty", children: t2("载入中…") }) : null,
      state !== null && tab === "calendar" ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(QuickAdd, { onImport: (events) => void importEvents(events) }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          CalendarView,
          {
            state,
            locale,
            onCreate: (day) => setEditor({ event: null, day }),
            onOpen: (event) => setEditor({ event, day: /* @__PURE__ */ new Date() })
          }
        )
      ] }) : null,
      state !== null && tab === "timetable" ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        Timetable,
        {
          state,
          onSaveCourse: (course) => void saveCourse(course),
          onDeleteCourse: (id) => void deleteCourse(id),
          onImport: (courses, replace) => void importCourses(courses, replace),
          onAiParse: parseTimetable,
          onEnable: () => void saveSettings({ timetableEnabled: true })
        }
      ) : null,
      state !== null && tab === "plan" ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        PlanPage,
        {
          state,
          onSave: (plan) => void savePlan(plan),
          onDelete: (id) => void deletePlan(id),
          onToggle: (planId, milestoneId, done) => void toggleMilestone(planId, milestoneId, done)
        }
      ) : null
    ] }),
    busy ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "dshc-busy", role: "status", "aria-live": "polite" }) : null,
    editor !== null ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      EventEditor,
      {
        initial: editor.event,
        day: editor.day,
        defaultLead: state?.settings.defaultRemindBefore ?? 10,
        onCancel: () => setEditor(null),
        onSave: saveEvent,
        onDelete: deleteEvent
      }
    ) : null,
    settingsOpen && state !== null ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      SettingsPanel,
      {
        state,
        onClose: () => setSettingsOpen(false),
        onSettings: (patch) => saveSettings(patch),
        onTerm: (term) => saveTerm(term),
        onReload: reload
      }
    ) : null
  ] });
}

// src/client/index.tsx
var PANEL_ID = "dsh-schedule-calendar";
var inject = ["slots", "locale"];
function ensureStyles() {
  const marker = `style[data-plugin="${PANEL_ID}"]`;
  if (document.querySelector(marker) !== null) return;
  const tag = document.createElement("style");
  tag.dataset.plugin = PANEL_ID;
  tag.textContent = CSS;
  document.head.appendChild(tag);
}
function followLocale(ctx, disposers) {
  const locale = ctx.locale ?? ctx.get?.("locale");
  if (locale?.getLocale === void 0) return;
  const sync = () => {
    try {
      const active = locale.getLocale?.()?.active;
      if (typeof active === "string" && active !== "") setLanguage(active);
    } catch {
    }
  };
  sync();
  if (typeof locale.subscribe === "function") {
    const stop = locale.subscribe(sync);
    if (typeof stop === "function") disposers.push(stop);
  }
}
function apply(ctx) {
  ensureStyles();
  const disposers = [];
  followLocale(ctx, disposers);
  disposers.push(
    ctx.slots.inject(
      "sidebar.panellist",
      () => ctx.slots.register(
        {
          name: "sidebar.panellist",
          id: PANEL_ID,
          order: 40,
          label: () => t("日程")
        },
        CalendarIcon
      )
    )
  );
  disposers.push(
    ctx.slots.inject(
      "main",
      () => ctx.slots.register(
        {
          name: "main",
          key: PANEL_ID
        },
        CalendarPage
      )
    )
  );
  disposers.push(
    ctx.slots.inject(
      "shell.overlay",
      () => ctx.slots.register(
        {
          name: "shell.overlay",
          id: `${PANEL_ID}-notices`,
          order: 20
        },
        NoticeHost
      )
    )
  );
  const dispose = () => {
    for (const stop of disposers.splice(0)) {
      try {
        stop();
      } catch {
      }
    }
  };
  if (typeof ctx.effect === "function") ctx.effect(() => dispose, "dsh-schedule-calendar: surfaces");
}

		return module.exports;
	}
});
