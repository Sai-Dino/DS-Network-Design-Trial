import { IPopoverPosition } from "@murv/visibility-toggle";

export const MAX_TOP_NAV_ITEM_THRESHOLD = 10;
export const MORE_LABEL = "More";

export const ORIENTATION = {
  VERTICAL: "vertical",
  HORIZONTAL: "horizontal",
} as const;

export const MENU_POSITION: Record<"VERTICAL" | "HORIZONTAL", IPopoverPosition> = {
  VERTICAL: "right-start",
  HORIZONTAL: "bottom-center",
};
