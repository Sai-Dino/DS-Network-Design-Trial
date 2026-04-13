import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import MoreItems from "./components/MoreItem";
import { INavigationRail } from "./types";
import { MAX_TOP_NAV_ITEM_THRESHOLD, MENU_POSITION, ORIENTATION } from "./constants";
import { NavigationRailWrapper } from "./styles";
import { useResize } from "./hooks";

/* 
  Nav Bar padding top and bottom 8px + 8px
  Vertical each nav item height: 54px and 8px Gap between elements 
  So, for n items, total height = 54n + (n-1)*8 + 16 = 62n + 8 = availableHeight

  Similaryl for Width, 80n + (n-1)*8 + 16 = 88n + 8 = availableWidth
*/
const APPROX_NAV_ITEM_HEIGHT = 54;
const APPROX_NAV_ITEM_WIDTH = 80;

const NavigationRail: React.FC<INavigationRail> = ({
  topNavigation = [],
  maxTopNavItemCount,
  dataTestId,
  selectedNavItem,
  orientation = ORIENTATION.VERTICAL,
  customMoreItemOrientation = MENU_POSITION.VERTICAL,
  hideCloseIcon = false,
  maxContainerDimension,
}) => {
  const navigationRef = useRef<HTMLMenuElement>(null);
  const [topNavItems, setTopNavItems] = useState<Array<React.ReactNode>>(topNavigation);
  const [isMore, setIsMore] = useState(false);
  const [moreItems, setMoreItems] = useState<Array<React.ReactNode>>([]);

  const approxDimension = useMemo(() => {
    let dimension =
      orientation === ORIENTATION.HORIZONTAL ? APPROX_NAV_ITEM_WIDTH : APPROX_NAV_ITEM_HEIGHT;

    // Determine the maximum dimension of navigation items
    if (navigationRef && navigationRef.current && navigationRef.current.children) {
      Array.from(navigationRef.current.children)
        .filter((child) => !(child.id && child.id.includes("content-menu")))
        .forEach((child) => {
          const childElement = child as HTMLElement;
          const childDimension = (() => {
            if (orientation === ORIENTATION.HORIZONTAL) {
              /* We need to have a cap on maxWidth/maxHeight, bacause when menu collapses one item takes more space and again when window size increases the size of the item increases with it.
            Also, when the sub-menus are open the maxHeight or maxWidth or element can be more 
            */
              return childElement.offsetWidth < 100 ? childElement.offsetWidth : dimension;
            }
            return childElement.offsetHeight < 100 ? childElement.offsetHeight : dimension;
          })();
          if (childDimension > dimension) {
            dimension = childDimension;
          }
        });
    }
    return dimension;
  }, [orientation, topNavigation, navigationRef.current]);

  const determineItemsToShow = useCallback(() => {
    const containerDimension =
      maxContainerDimension ??
      (orientation === ORIENTATION.HORIZONTAL ? window.innerWidth : window.innerHeight);

    let maxItemsCanBeRenderedInTheMenuDimension =
      Math.floor((containerDimension - 8) / (approxDimension + 8)) - 1; // Subtracting 1 to give space

    if (maxItemsCanBeRenderedInTheMenuDimension < 1) {
      maxItemsCanBeRenderedInTheMenuDimension = 1;
    }

    const maxMenuCount = Math.min(
      maxTopNavItemCount ?? MAX_TOP_NAV_ITEM_THRESHOLD,
      maxItemsCanBeRenderedInTheMenuDimension,
    );

    if (topNavigation.length <= maxMenuCount) {
      setTopNavItems(topNavigation);
      setIsMore(false);
      setMoreItems([]);
    } else {
      setTopNavItems(topNavigation.slice(0, maxMenuCount - 1));
      setIsMore(true);
      setMoreItems(topNavigation.slice(maxMenuCount - 1));
    }
  }, [approxDimension, orientation, maxContainerDimension, topNavigation, maxTopNavItemCount]);

  useEffect(determineItemsToShow, [determineItemsToShow]);

  useResize(determineItemsToShow);

  const [selectedIndex, setSelectedIndex] = useState<number | undefined>(selectedNavItem);

  useEffect(() => {
    setSelectedIndex(selectedNavItem);
  }, [selectedNavItem]);

  return (
    <NavigationRailWrapper
      orientation={orientation}
      data-testid={dataTestId}
      role="menubar"
      ref={navigationRef}
    >
      {topNavItems.length > 0
        ? topNavItems.map((railItem: any, currentIndex: number) => {
            const newRailItemElement = React.cloneElement(railItem, {
              currentIndex,
              setSelected: () => {
                setSelectedIndex(currentIndex);
              },
              orientation,
              selected: currentIndex === selectedIndex,
              hideCloseIcon,
            });

            return newRailItemElement;
          })
        : null}

      {isMore ? (
        <MoreItems
          moreItems={moreItems}
          orientation={orientation}
          customMoreItemOrientation={customMoreItemOrientation}
          hideCloseIcon={hideCloseIcon}
          selected={selectedIndex !== undefined && selectedIndex >= topNavItems.length}
          setSelected={() => {
            setSelectedIndex(topNavItems.length);
          }}
        />
      ) : null}
    </NavigationRailWrapper>
  );
};

export default NavigationRail;
