export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

/** Typing in a field: single-key shortcuts type there instead. */
export const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))

/** A dialog, drawer, form, menu or dropdown is open: single-key shortcuts stay off so they don't act behind it. */
export const hasOpenOverlay = () =>
  document.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]') !== null
