import React from "react";

export interface TooltipProps {
  /**
   * Id for tooltip component
   */
  id?: string;
  /**
   * Pass test id for unit tests
   */
  dataTestId?: string;
  /**
   * Pass the text to show in tooltip
   */
  tooltipText: string;
  /**
   * Pass the element that will be hovered
   */
  children: React.ReactNode;
  /**
   * Pass the icon id to render
   * @default true
   */
  showIcon?: boolean;
  /**
   * Pass the position of the tooltip
   */
  position: "top" | "bottom" | "left" | "right";
}