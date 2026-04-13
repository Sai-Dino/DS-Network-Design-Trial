export interface IVisibilityToggleHelperProps {
  children: React.ReactNode;
  renderTarget: (props: any) => React.ReactElement | React.ReactNode;
  action?: "hover" | "click";
  position?: IPopoverPosition;
  offset?: { x: number; y: number }; // Offset from the target
  onVisibilityChange?: (isVisible: boolean) => void;
  closeOnClickOutside?: boolean;
  initialIsVisible?: boolean; // Should Default be visible
  isChildInteractive?: boolean; // Incase the child is interactive, we need to prevent the Popover from closing instantly when mouse leaves the target
  childInteractiveTimeout?: number; // Time in ms to wait before closing the Popover when the child is interactive
  testId?: string;
  id?: string;
  popoverStyles?: React.CSSProperties;
}

export type IPopoverPosition =
  | "right-center"
  | "right-top"
  | "right-bottom"
  | "left-center"
  | "left-top"
  | "left-bottom"
  | "top-center"
  | "top-right"
  | "top-left"
  | "bottom-center"
  | "bottom-right"
  | "bottom-left"
  | "top-start"
  | "top-end"
  | "bottom-start"
  | "bottom-end"
  | "right-start"
  | "right-end"
  | "left-start"
  | "left-end";

export interface IVisibilityToggleHelperRef {
  close: () => void; // Close the Popover.
  open: () => void; // Open the Popover.
}
