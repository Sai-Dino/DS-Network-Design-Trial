import { HTMLAttributes } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Id for the badge
   */
  id?: string;
  /**
   * Pass test id for unit tests
   */
  dataTestId?: string;
  /**
   * Title for badge
   * @default 'Unread Notifications'
   */
  title?: string;
  /**
   * Type of badge to display
   * @default 'highlight'
  */
  type?: "highlight" | "subtle" | "brand";
  /**
   * Whether badge is disabled or not
   * @default false
   */
  disabled?: boolean;
  /**
   * To pass the number to be shown in badge
   */
  children?: number | string;
}
