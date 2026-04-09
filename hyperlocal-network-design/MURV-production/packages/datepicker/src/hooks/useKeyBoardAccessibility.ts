import { useEffect, useRef } from "react";

const useKeyboardAccessibility = () => {
  const datePickerRef = useRef<HTMLTableElement>();
  let focussedIndex = 0;

  useEffect(() => {
    const [leftNavigation, rightNavigation] = (
      datePickerRef as React.MutableRefObject<HTMLTableElement>
    ).current.querySelectorAll('[role = "button"]') as NodeListOf<HTMLDivElement>;

    leftNavigation.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        leftNavigation.tabIndex = -1;
        (rightNavigation as HTMLDivElement).tabIndex = 0;
        (rightNavigation as HTMLDivElement).focus();
      }
    });

    rightNavigation.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        rightNavigation.tabIndex = -1;
      }
    });

    const dates = (
      datePickerRef as React.MutableRefObject<HTMLTableElement>
    ).current.querySelectorAll("[data-date-index]") as NodeListOf<HTMLTableCellElement>;

    const handleKeyDown = (event: KeyboardEvent) => {
      const ele = event.currentTarget as HTMLDivElement;

      if (ele.hasAttribute('[role = "button"]')) {
        if (leftNavigation.tabIndex === 0) {
          leftNavigation.tabIndex = -1;
          rightNavigation.tabIndex = 0;
          rightNavigation.focus();
        } else {
          rightNavigation.tabIndex = -1;
          focussedIndex = 0;
        }
      }

      if (focussedIndex >= dates.length) {
        leftNavigation.tabIndex = 0;
        rightNavigation.tabIndex = -1;
        leftNavigation.focus();
        focussedIndex = 0;
        return;
      }
      if (
        event.key === "ArrowRight" &&
        leftNavigation.tabIndex === -1 &&
        rightNavigation.tabIndex === -1
      ) {
        if (dates[focussedIndex].hasAttribute("data-date-index")) {
          rightNavigation.tabIndex = -1;
          dates[focussedIndex].tabIndex = 0;
          dates[focussedIndex].focus();
        }

        focussedIndex += 1;
      }
    };
    (datePickerRef as React.MutableRefObject<HTMLTableElement>).current.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      if (datePickerRef.current) {
        (datePickerRef as React.MutableRefObject<HTMLTableElement>).current.removeEventListener(
          "keydown",
          handleKeyDown,
        );
      }
    };
  }, [datePickerRef]);

  const setDatePickerRef = (node: HTMLTableElement) => {
    datePickerRef.current = node;
  };

  return { setDatePickerRef } as const;
};

export default useKeyboardAccessibility;
