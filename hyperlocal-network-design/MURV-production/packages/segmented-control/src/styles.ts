import styled from "styled-components";
import { IOptionsTextProps, ISegmentedControlOptionWrapperProps } from "./types";

/* Styled wrapper for segmented controls */
export const SegmentedControlWrapper = styled.fieldset`
  overflow: hidden;
  display: flex;
  align-items: flex-start;
  width: 100%;

  border: 2px solid ${({ theme }) => theme.murv.color.stroke.primary};
  border-radius: ${({ theme }) => theme.murv.radius.s};
`;

export const StyledLegend = styled.legend`
  display: none;
`;

/* Styled wrapper for segmented control options */
export const SegmentedControlOptionWrapper = styled.label<ISegmentedControlOptionWrapperProps>`
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  display: flex;
  height: 36px;
  padding: ${({ theme }) => theme.murv.spacing.s};
  justify-content: center;
  align-items: center;
  gap: ${({ theme }) => theme.murv.spacing.xxs};
  flex: 1 0 0;

  /* Text related styles */
  color: ${({ theme, disabled, isSelected }) => {
    if (isSelected) {
      return disabled ? theme.murv.color.text.disabled : theme.murv.color.text.brand;
    }
    return theme.murv.color.text.primary;
  }};
  font-size: ${({ theme }) => theme.murv.typography.body.s.size};
  line-height: ${({ theme }) => theme.murv.typography.body.s.lineHeight};

  border-right: 2px solid ${({ theme }) => theme.murv.color.stroke.primary};
  &:last-child {
    border: none;
  }
  &:hover {
    background: ${({ theme, isSelected }) =>
      isSelected
        ? theme.murv.color.surface.selected.hover
        : theme.murv.color.surface.neutral.hover};
  }
  &:focus {
    border: 2px solid
      ${({ theme, isSelected }) =>
        isSelected ? theme.murv.color.surface.brand.default : theme.murv.color.stroke.selected};
  }
  &:active {
    background-color: ${({ theme, isSelected }) =>
      isSelected
        ? theme.murv.color.surface.selected.pressed
        : theme.murv.color.surface.neutral.pressed};
  }
  background: ${({ theme, isSelected, disabled }) => {
    if (isSelected) {
      return disabled
        ? theme.murv.color.surface.disabled.default
        : theme.murv.color.surface.selected.default;
    }
    return theme.murv.color.surface.neutral.default;
  }};
  #trigger-single-select {
    /* Hover Styles */
    &:hover {
      background-color: transparent;
    }

    /* Focus Styles */
    &:focus:not(:disabled) {
      background-color: transparent;
    }

    /* Active (on Pressed) Styles */
    &:active:not(:disabled) {
      background-color: transparent;
      outline-offset: 2px;
    }
  }
`;

/* Styled text for segmented control options */
export const OptionsInput = styled.input<IOptionsTextProps>`
  width: 0;
  opacity: 0;
`;
