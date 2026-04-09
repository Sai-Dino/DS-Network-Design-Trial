import { IPopoverPosition } from "@murv/visibility-toggle";

/**
 * Props for the popover upload
 * @property showBack - Whether to show the back button in the header
 * @property showCancel - Whether to show the cancel button in the header
 * @property headerText - Text to be displayed in the header
 * @property popoverAction - Action to be performed to show the popover
 * @property onClose - Callback to be called when the popover is closed
 * @property renderTarget - Target for the popover
 * @property isPopoverOpen - Whether the popover is open
 * @property onVisibilityChange - Callback to be called when the visibility of the popover changes
 * @property offset - The offset of the popover from the target x and y position
 * @property popoverPosition - Position of the popover
 */

export interface IPopoverUpload {
  showBack?: boolean;
  showCancel?: boolean;
  headerText: string;
  popoverAction?: "hover" | "click";
  onClose?: () => void;
  renderTarget: (props: any) => React.ReactElement | React.ReactNode;
  isPopoverOpen?: boolean;
  onVisibilityChange?: (isVisible: boolean) => void;
  offset?: { x: number; y: number }; // Offset from the target
  popoverPosition?: IPopoverPosition;
}
