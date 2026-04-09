import React, { FC, useState } from "react";
import { ChevronLeft, Close } from "@murv/icons";
import { MenuItem } from "./MenuItem";
import { IMenuListProps, IHistoryStack, IMenuItemProps, IHeaderProps } from "../types";
import { MenuWrapper, MenuTitleWrapper, TitleText, MenuItemsContainer, IconBtn } from "../styles";
import { getDropDownHeightFor } from "../utils";
import { MENU_TYPE } from "../constants";

const getHeaderFormat = (menu: IMenuItemProps[]) => {
  const flattened: Array<IMenuItemProps | IHeaderProps> = [];
  function flatten(items: IMenuItemProps[]) {
    items.forEach((item) => {
      const currentItem = { ...item };
      if (item.menuItems && item.menuItems.length > 0) {
        flattened.push({ parentLabel: item.label });
      } else {
        flattened.push(currentItem);
      }
      if (item.menuItems && item.menuItems.length > 0) {
        flatten(item.menuItems);
      }
    });
  }
  flatten(menu);
  return flattened;
};

const MenuList: FC<IMenuListProps> = (props) => {
  const {
    title = "",
    menuItems = [],
    closeMenu = () => {},
    hasActionables = false,
    scrollThreshold = Infinity,
    testId,
    groupMenuType,
    hideCloseIcon = false,
    ...menuItemProps
  } = props;

  const [historyStack, setHistoryStack] = useState<IHistoryStack[]>([
    {
      title,
      menuItems,
      hasActionables,
      subMenuGroupType: MENU_TYPE.SUBMENU,
    },
  ]);

  const calculateHeight = (ref: HTMLDivElement) => {
    const listRef = ref;
    if (listRef) {
      const height = getDropDownHeightFor(listRef.children, scrollThreshold);
      listRef.style.maxHeight = height;
    }
  };

  const onItemClick = (clickedItem: IHistoryStack, onClick: Function) => {
    if (onClick && typeof onClick === "function") {
      onClick();
    }
    if (clickedItem.menuItems.length > 0) {
      const newStack = [...historyStack, clickedItem];
      setHistoryStack(newStack);
    }
  };

  const onBack = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    const newStack = [...historyStack];
    newStack.pop();
    setHistoryStack(newStack);
  };

  const latestMenu: IHistoryStack = historyStack[historyStack.length - 1];

  if (groupMenuType === MENU_TYPE.HEADER || latestMenu.subMenuGroupType === MENU_TYPE.HEADER) {
    const isSubMenuHeaderType = latestMenu.subMenuGroupType === MENU_TYPE.HEADER;
    return (
      <MenuWrapper data-testId={`menu-dropdown-${testId}`}>
        {getHeaderFormat(
          isSubMenuHeaderType ? [{ ...latestMenu, label: latestMenu.title }] : menuItems,
        ).map((item) => {
          if ("parentLabel" in item)
            return (
              <MenuTitleWrapper data-testId={`menu-header-${testId}`}>
                {isSubMenuHeaderType &&
                  latestMenu.title === item.parentLabel &&
                  historyStack.length > 1 && (
                    <IconBtn onClick={onBack}>
                      <ChevronLeft />
                    </IconBtn>
                  )}
                <TitleText> {item.parentLabel} </TitleText>
                {!hideCloseIcon && isSubMenuHeaderType && latestMenu.title === item.parentLabel && (
                  <IconBtn onClick={() => closeMenu()}>
                    <Close />
                  </IconBtn>
                )}
              </MenuTitleWrapper>
            );
          return (
            <MenuItemsContainer ref={calculateHeight} data-testId={`menu-items-${testId}`}>
              <MenuItem
                {...item}
                testId={testId}
                onItemClick={onItemClick}
                groupMenuType={groupMenuType}
                hasActionables={item.hasActionables || item.hasActionables}
                {...menuItemProps}
              />
            </MenuItemsContainer>
          );
        })}
      </MenuWrapper>
    );
  }
  return (
    <MenuWrapper data-testId={`menu-dropdown-${testId}`}>
      {latestMenu.title && (
        <MenuTitleWrapper data-testId={`menu-header-${testId}`}>
          {historyStack.length > 1 && (
            <IconBtn onClick={onBack}>
              <ChevronLeft />
            </IconBtn>
          )}
          <TitleText> {latestMenu.title} </TitleText>
          {!hideCloseIcon && (
            <IconBtn onClick={() => closeMenu()}>
              <Close />
            </IconBtn>
          )}
        </MenuTitleWrapper>
      )}
      <MenuItemsContainer ref={calculateHeight} data-testId={`menu-items-${testId}`}>
        {latestMenu.menuItems.length > 0 &&
          latestMenu.menuItems.map((menuItem) => (
            <MenuItem
              {...menuItem}
              testId={testId}
              onItemClick={onItemClick}
              groupMenuType={groupMenuType}
              hasActionables={menuItem.hasActionables || latestMenu.hasActionables}
              key={`menu-item-${menuItem.label}`}
              {...menuItemProps}
            />
          ))}
      </MenuItemsContainer>
    </MenuWrapper>
  );
};

export { MenuList };
