/* Popover has less cross browser support than dialog. In case, dialog contains a popover and dialog is supported in the browser and popover is not supported, then we need to swich to dialog polyfill.
 * Since, dialog is the top element, we
 * Ref: https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using#showing_popovers_via_javascript
 * @returns True if browser supports popover api
 */
export function supportsPopover() {
  // eslint-disable-next-line no-prototype-builtins
  return HTMLElement.prototype.hasOwnProperty("popover");
}
