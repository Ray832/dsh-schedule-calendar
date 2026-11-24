/** Package-wide stylesheet, injected once when the bundle materializes. */

export const CSS = `
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
`
