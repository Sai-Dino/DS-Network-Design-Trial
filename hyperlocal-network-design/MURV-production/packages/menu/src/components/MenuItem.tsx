import React, { FC } from "react";
import { ChevronRight } from "@murv/icons";
import { IMenuItemProps } from "../types";
import { MenuItemWrapper, MenuItemLinkWrapper, MenuItemText, ItemLabelWrapper } from "../styles";
import { MENU_TYPE } from "../constants";

const MenuItem: FC<IMenuItemProps> = (props) => {
  const {
    label,
    leftIcon,
    onItemClick = () => {},
    menuItems = [],
    renderItem = null,
    disabled = false,
    onClick = () => {},
    hasActionables,
    testId,
    groupMenuType,
    subMenuGroupType,
    url,
  } = props;

  const handleClick = (e: React.MouseEvent) => {
    // If there are submenus, prevent default anchor behavior
    if (menuItems.length > 0) {
      e.preventDefault();
    }
    e.stopPropagation();
    onItemClick(
      {
        title: label,
        menuItems,
        hasActionables,
        subMenuGroupType,
      },
      onClick,
    );
  };

  const WrapperComponent = (url ? MenuItemLinkWrapper : MenuItemWrapper) as React.ElementType;

  return (
    renderItem || (
      <WrapperComponent
        data-disabled={disabled}
        disabled={disabled}
        isActionable={hasActionables && menuItems.length === 0}
        data-testId={`option-item-${label}-${testId}`}
        onClick={handleClick}
        {...(url ? { href: url } : {})}
      >
        <ItemLabelWrapper>
          {leftIcon}
          <MenuItemText isHeaderMenu={groupMenuType === MENU_TYPE.HEADER}> {label} </MenuItemText>
        </ItemLabelWrapper>
        {menuItems.length > 0 && <ChevronRight />}
      </WrapperComponent>
    )
  );
};

export { MenuItem };
