import React from "react";

export interface CarouselProps extends React.HTMLAttributes<HTMLAnchorElement> {
  /**
   * Pass the elements that needs to be rendered
   */
  children: React.ReactNode[];
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
}
