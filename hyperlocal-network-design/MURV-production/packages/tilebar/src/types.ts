import React from "react";
import { ITileProps as ITileProps1 } from "@murv/tile";

/**
 * Represents the properties of a tile.
 */
export type ITileProps = Omit<ITileProps1, "onClick" | "onFocus" | "onHover" | "id"> & {
  id: string;
};

/**
 * Represents the props for the TileBar component.
 */
export interface ITileBarProps {
  /**
   * An array of TileProps representing the tiles to be rendered.
   */
  tiles: ITilesComponentProps[];
  /**
   * The gap between the tiles.
   */
  gap?: string;
  /**
   * The test ID for the TileBar component.
   */
  testId?: string;
  /**
   * Event handler for click events on the TileBar component.
   */
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, id: string) => void;
  /**
   * Event handler for hover events on the TileBar component.
   */
  onHover?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, id: string) => void;
  /**
   * Event handler for focus events on the TileBar component.
   */
  onFocus?: (event: React.FocusEvent<HTMLDivElement>, id: string) => void;
  /**
   * selectedId for a tilebar
   */
  selectedId?: string;
}

/**
 * Props for the TilesComponent.
 */
export interface ITilesComponentProps extends ITileProps {
  /**
   * Determines whether the tiles should have a divider between them.
   */
  hasDivider?: boolean;
}
