import React from "react";
import { Menu } from "@murv/menu";
import { IPopoverPosition } from "@murv/visibility-toggle";
import { INavigationRailItemWithState } from "../../types";
import { createSubMenuConfig } from "./utils";
import MainMenuItem from "./MainMenuItem";
import { MENU_POSITION, ORIENTATION } from "../../constants";

const evaluatePopoverPosition = (
  orientation: string,
  customPopoverPosition?: IPopoverPosition,
): IPopoverPosition => {
  if (customPopoverPosition) {
    return customPopoverPosition;
  }
  return orientation === ORIENTATION.VERTICAL ? MENU_POSITION.VERTICAL : MENU_POSITION.HORIZONTAL;
};

const NavigationRailItem: React.FC<INavigationRailItemWithState> = ({
  label = "",
  icon,
  url,
  onClick,
  badge,
  disabled,
  subMenuItems = [],
  currentIndex,
  selected,
  setSelected,
  groupMenuType = "submenu",
  orientation = ORIENTATION.VERTICAL,
  hideCloseIcon,
  customPopoverPosition,
}) =>
  subMenuItems.length > 0 ? (
    // Keeping this check here till Menu takes the open prop correctly. Currently if set false the Menu still opens
    <Menu
      title={label}
      groupMenuType={groupMenuType}
      menuItems={createSubMenuConfig({ itemList: subMenuItems, setSelected })}
      popoverPosition={evaluatePopoverPosition(orientation, customPopoverPosition)}
      popoverAction="hover"
      hideCloseIcon={hideCloseIcon}
      renderTarget={(props) => (
        <MainMenuItem
          disabled={disabled}
          selected={selected}
          setSelected={setSelected}
          currentIndex={currentIndex}
          onClick={onClick}
          badge={badge}
          label={label}
          icon={icon}
          url={url}
          {...props}
        />
      )}
      id={`nav-menu-${label}`}
      testId={`nav-menu-${label}`}
    />
  ) : (
    <MainMenuItem
      disabled={disabled}
      selected={selected}
      setSelected={setSelected}
      currentIndex={currentIndex}
      onClick={onClick}
      badge={badge}
      label={label}
      icon={icon}
      url={url}
    />
  );

export { createSubMenuConfig };
export default NavigationRailItem;
