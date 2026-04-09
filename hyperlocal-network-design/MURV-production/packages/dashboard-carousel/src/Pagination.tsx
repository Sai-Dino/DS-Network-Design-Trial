import React from "react";
import { ChevronLeft, ChevronRight } from "@murv/icons";
import { Button } from "@murv/button";
import { Badge } from "@murv/badge";
import { PaginationContainer } from "./styles";

interface PaginationProps {
  paginationPosition: "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  onLeftClick: () => void;
  onRightClick: () => void;
  currentSlide: number;
  totalSlides: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  paginationPosition,
  onRightClick,
  onLeftClick,
  currentSlide,
  totalSlides,
}) => (
  <PaginationContainer position={paginationPosition}>
    <Button
      buttonType="secondary"
      buttonStyle="brand"
      onClick={onLeftClick}
      aria-label="Previous Slide"
      data-testid="carousel-left-nav"
      SuffixIcon={ChevronLeft}
      disabled={currentSlide === 0}
    />
    <Badge type="brand">{`${currentSlide + 1} / ${totalSlides}`}</Badge>
    <Button
      buttonType="secondary"
      buttonStyle="brand"
      onClick={onRightClick}
      aria-label="Next Slide"
      data-testid="carousel-right-nav"
      SuffixIcon={ChevronRight}
      disabled={currentSlide === totalSlides - 1}
    />
  </PaginationContainer>
);
