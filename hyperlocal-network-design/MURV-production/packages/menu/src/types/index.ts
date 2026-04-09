import React from "react";
import { IPopoverPosition } from "@murv/visibility-toggle";

export interface IHeaderProps {
  parentLabel: string;
}

export interface IMenuItemProps {
  /**
   * Option Item Text, also used as component key
   */
  label: string;

  /**
   * Optional href for native anchor navigation.
   * Enables browser features like “Open link in new tab”.
   */
  url?: string;

  /**
   * onClick behaviour for option message
   */
  onClick?: Function;
  /**
   * Render Left Icon on the option item
   */
  leftIcon?: React.ReactNode;
  /**
   * List of nested Option Items
   */
  menuItems?: IMenuItemProps[];
  /**
   * Disable Option Item
   */
  disabled?: boolean;
  /**
   * Render custom component in popup menu
   */
  renderItem?: React.ReactElement;
  /**
   * Toggle menu item to close on outside click
   */
  closeOnClickOutside?: boolean;
  /**
   * used for actionable option items (renders option item in brand blue)
   */
  hasActionables?: boolean;
  /**
   * Used Internally
   */
  onItemClick?: Function;
  /**
   * Used Internally (uses menu's testId value)
   */
  testId?: string;
  /*
   * Used to determine if the root menu is header or nested submenu type
   */
  groupMenuType?: string;
  /*
   * Used to determine if submenu is header or nested submenu type
   */
  subMenuGroupType?: string;
}

export interface IMenuProps {
  /**
   * interactable component to open menu
   */
  renderTarget: (props: any) => React.ReactElement | React.ReactNode;
  /**
   * variable to control visibility of menu (optional)
   */
  open?: boolean;
  /**
   * TestId, same value passed down and used by internal components
   */
  testId?: string;

  /**
   * Open menu via Click or Hover
   */
  popoverAction?: "hover" | "click";
  /**
   * Menu's Position
   */
  popoverPosition?: IPopoverPosition;
  /**
   * Function to listen menu's visibility state
   */
  onVisibilityChange?: (isVisible: boolean) => void;
  /**
   * Will close menu on outside click: default: false
   */
  closeOnClickOutside?: boolean;
  /**
   * threshold to render menu items in scrollable panel,
   * provided value is number of option item to display before scroll bar option item
   * default: Infinity (Do not render scrollbar)
   */
  scrollThreshold?: number;
  /**
   * list of option items
   */
  menuItems: IMenuItemProps[];

  /**
   * ID for Visibility Toggle
   */
  id?: string;
  /**
   * Main Title of the first menu list (passed down internally)
   */
  title?: string;
  /**
   * Used Internally
   */
  isSubMenu?: boolean;
  /**
   * Used to decide the submenu item variation
   */
  groupMenuType?: string;
  /**
   * Used to decide if we want to show close icon in submenus
   */
  hideCloseIcon?: boolean;
}

/**
 * Props passed down from Menu to MenuList
 */
export interface IMenuListProps {
  menuItems: IMenuItemProps[];
  title?: string;
  closeMenu?: Function;
  closeOnClickOutside?: boolean;
  hasActionables?: boolean;
  scrollThreshold?: number;
  testId?: string;
  groupMenuType: string;
  hideCloseIcon?: boolean;
}

/**
 * Used Internally by the component
 */
export interface IHistoryStack {
  title: string;
  menuItems: IMenuItemProps[];
  hasActionables: boolean;
  subMenuGroupType: string;
}

export interface IGetDropDownHeightForArgs {
  children: React.ReactChildren;
  count: number;
}

export interface IMenuItemStyled {
  isHeaderMenu: boolean;
}
