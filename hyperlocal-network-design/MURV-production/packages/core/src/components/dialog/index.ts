import { DialogNative } from "./DialogNative";
import { DialogPolyfill } from "./DialogPolyfill";
import { supportsPopover } from "./utils";

const Dialog =
  typeof HTMLDialogElement === "function" && supportsPopover() ? DialogNative : DialogPolyfill;
export { Dialog, DialogNative, DialogPolyfill };
export default Dialog;
export type * from "./types";
