import React from "react";
import { TagProps } from "packages/tag/src";

export interface DashboardCarouselProps extends React.HTMLAttributes<HTMLAnchorElement> {
  /**
   * Pass the elements that needs to be rendered
   */
  children?: React.ReactNode[];
  /**
   * Cardwidth for the carousel
   */
  cardWidth: number;
  /**
   * Pass test id for unit tests
   */
  testId?: string;
  /**
   * Pass the width of carousel container
   */
  width?: string;
  /**
   * Pass the heigth of carousel card
   */
  cardHeight?: number;
  /**
   * Pass this as true if you want to autoplay carousel content
   */
  autoPlay?: boolean;
  /**
   * Pass this to specify the interval for the slides
   */
  autoPlayDuration?: number;
  /**
   * Callback for left navclick
   */
  leftNavCallBack?: (currentSlide: number) => void;
  /**
   * Callback for right navclick
   */
  rightNavCallBack?: (currentSlide: number) => void;
  /**
   * Margin for the carousel cards
   */
  itemSpacing?: number;
  /**
   * Position of pagination component
   */
  paginationPosition?: "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  /**
   * Header prefix Icon
   */
  headerIcon?: React.ReactNode;
  /**
   * Header Text
   */
  headerText: string;
  /**
   * Tag props for tag present in Header after Header text
   */
  headerTagProps?: TagProps;
  /**
   * Background color of Carousel
   */
  backgroundColor?: string;
}
