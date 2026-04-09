export const DIALOG_MODES = {
  ALERT: "alert",
  MODAL: "modal",
  NON_MODAL: "non_modal",
} as const;

export const AUTOFOCUS_ELEMENTS_SELECTOR = "[autofocus]";

export const FOCUSSABLE_ELEMENTS_SELECTOR = [
  "a[href]",
  "area[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "button:not([disabled])",
  "details",
  "summary",
  "iframe",
  "object",
  "embed",
  "video",
  "[contenteditable]",
  "[tabindex]",
].join(",");
