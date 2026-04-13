import { IPopoverPosition } from "@murv/visibility-toggle";
import { ORIENTATION } from "./constants";

type OrientationType = (typeof ORIENTATION)[keyof typeof ORIENTATION];
export interface IRailItemBadge {
  badge?: JSX.Element;
}

export interface IRailIemLabelBlock {
  label: string;
  icon?: React.ReactNode | undefined;
  disabled?: boolean;
  selected?: boolean;
}

export interface IRailItem extends IRailIemLabelBlock {
  url?: string;
  onClick?: () => void;
  subMenuItems?: Array<IRailItem>;
  groupMenuType?: string;
}

export interface IMenuOption {
  orientation?: OrientationType;
  selectedNavItem?: number;
  dataTestId?: string;
}

export interface INavigationRailItemWithState
  extends IRailItemBadge,
    IRailIemLabelBlock,
    IMenuOption,
    IRailItem {
  currentIndex?: number;
  setSelected?: () => void;
  groupMenuType?: string;
  hideCloseIcon?: boolean;
  customPopoverPosition?: IPopoverPosition;
}

export interface INavigationRail extends IMenuOption {
  topNavigation: Array<React.ReactNode>;
  maxTopNavItemCount?: number;
  hideCloseIcon?: boolean;
  customMoreItemOrientation?: IPopoverPosition;
  /**
   * Parent can provide approximate dimension (in px) of the container. Else window.innerHeight or window.innerWidth will be refrerred based on orientation
   */
  maxContainerDimension?: number;
}

export interface INavigationRailItemStyleProps {
  disabled?: boolean;
  tabIndex?: number;
  selected?: boolean;
}

export interface ISubMenuConfig {
  itemList: Array<IRailItem>;
  setSelected?: () => void;
}

export interface IMenuItemClick {
  onSubMenuClick?: () => void;
  subMenuUrl?: string;
  subMenuChildren?: Array<any>;
  setSelected?: () => void;
}

export interface IMoreItems {
  moreItems: any;
  orientation: OrientationType;
  hideCloseIcon: boolean;
  selected: boolean;
  setSelected?: () => void;
  customMoreItemOrientation?: IPopoverPosition;
}

export interface INavigationRailWrapperProps {
  orientation: OrientationType;
}

export interface IMainMenuItem extends INavigationRailItemWithState {
  additionalProps?: any;
  url?: string;
  onClick?: () => void;
}

export interface IItemLabel extends IRailItemBadge, IRailIemLabelBlock {
  onClick?: () => void;
}

export type INavigationRailItem = IRailItemBadge &
  Omit<IRailItem, "selected"> &
  Pick<IMenuOption, "dataTestId">;
