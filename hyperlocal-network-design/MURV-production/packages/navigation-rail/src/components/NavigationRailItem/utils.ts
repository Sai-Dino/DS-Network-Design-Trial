import { IMenuItemProps } from "@murv/menu";
import { ISubMenuConfig, IMenuItemClick } from "../../types";

const onMenuItemClick = ({
  onSubMenuClick,
  subMenuUrl,
  subMenuChildren = [],
  setSelected,
}: IMenuItemClick) => {
  if (onSubMenuClick && typeof onSubMenuClick === "function") {
    onSubMenuClick();
  }

  if (subMenuChildren?.length > 0) {
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

export const createSubMenuConfig = ({
  itemList = [],
  setSelected,
}: ISubMenuConfig): IMenuItemProps[] => {
  const subMenuList = itemList.map((item) => {
    const {
      label,
      icon: subMenuIcon,
      onClick: onSubMenuClick,
      url: subMenuUrl,
      subMenuItems: subMenuChildren = [],
    } = item;

    return {
      label,
      leftIcon: subMenuIcon,
      url: subMenuUrl,
      onClick: () =>
        onMenuItemClick({
          onSubMenuClick,
          subMenuUrl,
          subMenuChildren,
          setSelected,
        }),
      menuItems: createSubMenuConfig({ itemList: subMenuChildren, setSelected }),
    };
  });
  return subMenuList;
};
