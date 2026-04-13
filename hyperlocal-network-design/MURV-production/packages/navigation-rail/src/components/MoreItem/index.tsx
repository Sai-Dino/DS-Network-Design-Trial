import React from "react";
import { MoreHoriz } from "@murv/icons";
import { Menu } from "@murv/menu";
import { IPopoverPosition } from "@murv/visibility-toggle";
import NavigationRailItem, { createSubMenuConfig } from "../NavigationRailItem";
import { IMoreItems, IRailItem, IMenuItemClick } from "../../types";
import { MORE_LABEL, MENU_POSITION, ORIENTATION } from "../../constants";
import { MoreButton } from "../../styles";

const evaluatePopoverPosition = (
  orientation: string,
  customPopoverPosition?: IPopoverPosition,
): IPopoverPosition =>
  customPopoverPosition ??
  (orientation === ORIENTATION.VERTICAL ? MENU_POSITION.VERTICAL : MENU_POSITION.HORIZONTAL);

const MoreItems: React.FC<IMoreItems> = ({
  moreItems = [],
  orientation = ORIENTATION.VERTICAL,
  customMoreItemOrientation = MENU_POSITION.VERTICAL,
  hideCloseIcon = false,
  selected = false,
  setSelected,
}) => {
  const onMenuItemClick = ({ onSubMenuClick, subMenuUrl, subMenuChildren }: IMenuItemClick) => {
    if (onSubMenuClick && typeof onSubMenuClick === "function") {
      onSubMenuClick();
    }

    if (subMenuChildren && subMenuChildren.length > 0) {
      return true;
    }
    if (subMenuUrl) {
      window.location.href = subMenuUrl;
    }

    if (setSelected && typeof setSelected === "function") {
      setSelected();
    }

    return true;
  };

  const moreSubOptions = moreItems.map((item: { props: IRailItem }) => {
    const {
      props: {
        groupMenuType: subMenuGroupType = "submenu",
        label: subMenuLabel,
        icon: subMenuIcon,
        onClick: onSubMenuClick,
        url: subMenuUrl,
        subMenuItems: subMenuChildren = [],
      },
    } = item || {};
    const menuItems = createSubMenuConfig({ itemList: subMenuChildren, setSelected });
    return {
      subMenuGroupType,
      label: subMenuLabel,
      leftIcon: subMenuIcon,
      onClick: () => onMenuItemClick({ onSubMenuClick, subMenuUrl, subMenuChildren }),
      url: subMenuUrl,
      ...((subMenuChildren?.length > 0 && {
        menuItems,
      }) ||
        {}),
    };
  });

  return (
    <Menu
      title={MORE_LABEL}
      menuItems={moreSubOptions}
      popoverPosition={evaluatePopoverPosition(orientation, customMoreItemOrientation)}
      renderTarget={(props) => (
        <MoreButton {...props} role="none">
          <NavigationRailItem
            label={MORE_LABEL}
            // @ts-ignore
            icon={<MoreHoriz title={MORE_LABEL} />}
            currentIndex={-1}
            selected={selected}
            setSelected={setSelected}
            hideCloseIcon={hideCloseIcon}
          />
        </MoreButton>
      )}
      popoverAction="hover"
      hideCloseIcon={hideCloseIcon}
      id={`nav-menu-${MORE_LABEL}`}
      testId={`nav-menu-${MORE_LABEL}`}
    />
  );
};

export default MoreItems;
