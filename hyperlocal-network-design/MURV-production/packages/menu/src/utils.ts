import { IPopoverPosition } from "@murv/visibility-toggle";

export const getDropDownHeightFor = (children: HTMLCollection, count: number) => {
  let calculatedHeight = 0;

  if (children.length > count) {
    for (let i = 0; i < count; i += 1) {
      calculatedHeight += (children[i] as HTMLDivElement).offsetHeight;
    }

    return `${calculatedHeight}px`;
  }

  return "100%";
};

export const getOffset = (popoverPosition: IPopoverPosition) => {
  switch (popoverPosition) {
    case "right-center":
    case "right-top":
    case "top-right":
    case "right-bottom":
    case "left-center":
    case "top-left":
    case "left-top":
    case "left-bottom":
    case "right-start":
    case "right-end":
    case "left-start":
    case "left-end":
      return { x: 8, y: 0 };

    case "top-center":
    case "bottom-center":
    case "top-start":
    case "top-end":
    case "bottom-start":
    case "bottom-end":
    case "bottom-right":
    case "bottom-left":
      return { x: 0, y: 8 };

    default: // Same as right-center
      return { x: 8, y: 0 };
  }
};
