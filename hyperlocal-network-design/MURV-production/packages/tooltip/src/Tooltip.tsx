import React, { KeyboardEvent, useEffect, useState } from "react";
import { Icon } from "./Icon";
import { TooltipProps } from "./types";
import { TooltipContainer, TooltipText, TooltipWrapper } from "./styles";

/**
 * A tooltip is often used to specify extra information about something when the user moves the mouse pointer over an element.
 */
export const Tooltip: React.FC<TooltipProps> = ({
  id,
  dataTestId,
  children,
  tooltipText,
  showIcon = true,
  position,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const showTooltip = () => setIsVisible(true);
  const hideTooltip = () => setIsVisible(false);

  if (!children) {
    throw new Error(
      'No "children" is passed. Pass the element on hovering which the tooltip will be shown.',
    );
  }

  if (typeof tooltipText !== "string" || tooltipText.trim() === "") {
    throw new Error('The "tooltipText" prop must be a non-empty string.');
  }

  if (!position) {
    throw new Error('The "position" prop is missing');
  }

  // Closes or dismisses the Tooltip on pressing "Esc"
  useEffect(() => {
    const handleEscape: any = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsVisible(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // eslint-disable-next-line
  const TooltipComponent = () => (
    <TooltipContainer
      id={id}
      data-testid={dataTestId}
      position={position}
      aria-hidden={!isVisible}
      role="tooltip"
      aria-describedby={id}
    >
      {showIcon && <Icon id="info-icon" />}
      <TooltipText>{tooltipText}</TooltipText>
    </TooltipContainer>
  );

  return (
    <TooltipWrapper
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      tabIndex={0}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && <TooltipComponent />}
    </TooltipWrapper>
  );
};
