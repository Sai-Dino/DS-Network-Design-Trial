import React, { FC, useRef, useState, useEffect, useMemo } from "react";
import { VisibilityToggleHelper, IVisibilityToggleHelperRef } from "@murv/visibility-toggle";
import { useMURVContext } from "@murv/provider";
import { MenuList } from "./MenuList";
import { IMenuProps } from "../types";
import { getOffset } from "../utils";

const Menu: FC<IMenuProps> = (props) => {
  const { theme } = useMURVContext();
  const {
    open = false,
    renderTarget = () => null,
    popoverAction = "click",
    popoverPosition = "bottom-right",
    onVisibilityChange,
    isSubMenu,
    id = "",
    testId = "",
    closeOnClickOutside,
    groupMenuType = "submenu",
    ...menulistProps
  } = props;

  const toggleRef = useRef<IVisibilityToggleHelperRef>(null);
  const [openMenu, setOpenMenu] = useState(open);

  const changeMenuVisibility = (value: boolean) => {
    onVisibilityChange?.(value);
    setOpenMenu(value);
  };

  const closeMenu = () => {
    changeMenuVisibility(false);
    toggleRef?.current?.close?.();
  };

  useEffect(() => {
    if (!open && openMenu) {
      closeMenu();
    }
  }, [open]);

  const popoverStyles = useMemo(
    () => ({
      padding: `${theme.spacing.xxs} ${theme.spacing[0]}`,
      borderRadius: theme.radius.s,
      backgroundColor: theme.color.surface.neutral.default,
      border: `1px solid ${theme.color.stroke.primary}`,
      boxShadow: `${theme.spacing[0]} ${theme.spacing.xxs} ${theme.spacing.s} ${theme.spacing.xxs} rgba(0, 0, 0, 0.08)`,
    }),
    [theme],
  );

  return (
    <VisibilityToggleHelper
      offset={getOffset(popoverPosition)}
      renderTarget={renderTarget}
      action={popoverAction}
      testId={`menu-${testId}`}
      id={id}
      position={popoverPosition}
      initialIsVisible={open}
      onVisibilityChange={changeMenuVisibility}
      ref={toggleRef}
      closeOnClickOutside={closeOnClickOutside}
      popoverStyles={popoverStyles}
      isChildInteractive
    >
      {openMenu && (
        <MenuList
          {...menulistProps}
          groupMenuType={groupMenuType}
          testId={testId}
          closeOnClickOutside={closeOnClickOutside}
          closeMenu={closeMenu}
        />
      )}
    </VisibilityToggleHelper>
  );
};

export { Menu };
