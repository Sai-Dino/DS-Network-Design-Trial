import React, { forwardRef } from "react";
import { NavigationRailItemWrapper, NavigationRailLinkWrapper } from "../styles";
import ItemLabel from "../ItemLabel";
import { IMainMenuItem } from "../../../types";

const MainMenuItem = forwardRef<HTMLButtonElement | HTMLAnchorElement, IMainMenuItem>(
  (props, ref) => {
    const {
      disabled,
      selected,
      currentIndex,
      badge,
      label,
      icon,
      onClick,
      url,
      setSelected,
      ...additionalProps
    } = props;

    const onRailItemClick = () => {
      if (onClick && typeof onClick === "function") {
        onClick();
      }
      setSelected?.();
    };

    const WrapperComponent = (
      url ? NavigationRailLinkWrapper : NavigationRailItemWrapper
    ) as React.ElementType;

    return (
      <WrapperComponent
        onClick={onRailItemClick}
        disabled={disabled}
        aria-disabled={disabled}
        tabIndex={0}
        selected={selected}
        key={currentIndex}
        {...additionalProps}
        ref={ref}
        {...(url ? { href: url } : {})}
      >
        <ItemLabel
          disabled={disabled}
          badge={badge}
          label={label}
          icon={icon}
          selected={selected}
        />
      </WrapperComponent>
    );
  },
);

export default MainMenuItem;
