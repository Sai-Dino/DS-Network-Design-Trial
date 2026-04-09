import { HTMLAttributes, MouseEvent, FocusEvent } from "react";

/**
 * Represents the properties of a Tile component.
 */
export interface ITileProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Specifies the tab index of the Tile.
   */
  tabIndex?: number;
  /**
   * Indicates whether the Tile is selected or not.
   */
  selected?: boolean;
  /**
   * Specifies the class name for the Tile.
   */
  className?: string;
  /**
   * Provides a description for the Tile.
   */
  description?: string;
  /**
   * Specifies the label for the Tile.
   */
  label: string;
  /**
   * Indicates whether the Tile is disabled or not.
   */
  disabled?: boolean;
  /**
   * Provides additional information text for the Tile.
   */
  infoText?: string;
  /**
   * Defines tooltip's orientation
   */
  tooltipPosition?: "top" | "bottom" | "left" | "right";
  /**
   * Event handler for the click event on the Tile.
   */
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  /**
   * Specifies the heading for the Tile.
   */
  heading?: string;
  /**
   * Specifies the ID for the Tile.
   */
  id?: string;
  /**
   * Specifies the test ID for the Tile.
   */
  testId?: string;
  /**
   * Event handler for the focus event on the Tile.
   */
  onFocus?: (event: FocusEvent<HTMLDivElement, Element>) => void;
  /**
   * Event handler for the hover event on the Tile.
   */
  onHover?: (event: MouseEvent<HTMLDivElement>) => void;
  /**
   * Client can modify width. Useful in tilebar to adjust width of tiles with variable length contents.
   */
  width?: string;
}
