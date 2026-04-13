import React, { useRef, useEffect } from "react";
import { ICardContextProps } from "../types";
import { useCardContext } from "./useCardContext";

export const useCardInteractions: (
  onClick?: () => void,
) => ICardContextProps & { onClick?: () => void; ref?: React.Ref<HTMLDivElement> } = (onClick) => {
  const { interactable, disabled, ...rest } = useCardContext();
  const elementRef = useRef<HTMLDivElement | null>(null);
  const isInteractable = interactable && !disabled && onClick;
  if(!isInteractable) return rest;
  const handleClick = () => {
    if (interactable && !disabled && onClick) {
      onClick();
    }
  };
  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " " || event.code === "Space") {
      handleClick();
    }
  };
  useEffect(() => {
    const element = elementRef.current;
    element?.addEventListener("keypress", handleKeyPress);
    return () => {
      element?.removeEventListener("keypress", handleKeyPress);
    };
  }, [elementRef]);

  return {
    ...rest,
    onClick: handleClick,
    ref: elementRef,
  };
};
