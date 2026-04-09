import styled, { DefaultTheme, css } from "styled-components";
import Badge from "@murv/badge";
import { IDropdownTriggerProps, IStyledBadgeProps } from "./types";

const getBorderStyles = (theme: DefaultTheme, withBorder?: boolean) => {
  if (withBorder) {
    return css`
      border: 2px solid ${theme.murv.color.stroke.primary};
    `;
  }
  return css`
    border: none;
  `;
};

export const DropdownButton = styled.button<IDropdownTriggerProps>`
  /* Typography */
  font-size: ${({ theme }) => theme.murv.typography.body.sBold.size};

  font-weight: ${(props) =>
    props.triggerType && props.triggerType === "filter"
      ? props.theme?.murv?.typography.subtext.s.weight
      : props.theme.murv.typography.body.sBold.weight};

  cursor: pointer;

  /* Border Radius */
  border-radius: ${(props) => props.theme.murv.spacing.s};

  /* Background Color */
  background-color: transparent;

  /* Text Color */
  color: ${(props) =>
    props.triggerType && props.triggerType === "filter"
      ? props.theme?.murv?.color.icon.primary
      : props.theme?.murv?.color.text.primary};

  width: ${(props) => (props.buttonWidth ? props.buttonWidth : "content-width")};

  /* Flex Layout */
  display: flex;
  justify-content: space-between;
  gap: ${(props) => props.theme.murv.spacing.xxs};
  align-items: center;

  &:disabled {
    cursor: not-allowed;
    background-color: ${(props) => props.theme?.murv?.color.surface.disabled.default};
    color: ${(props) => props.theme?.murv?.color.text.disabled};
  }

  /* Padding */
  padding: ${(props) => `${props.theme.murv.spacing.s} ${props.theme.murv.spacing.l}`};

  /* Border */
  ${({ theme, withBorder }) => getBorderStyles(theme, withBorder)};

  /* Outline */
  outline: none;

  /*
  svg was rerendering and due to which the target ref of the visibility toggler is getting chnaged.
  if this is removed then the dropown is not expanded when clicked on the icon.
  */
  svg {
    pointer-events: none;
  }

  /* Hover Styles */
  &:hover,
  &[data-force-hover] {
    background-color: ${(props) => props.theme?.murv?.color.surface.neutral.hover};
  }

  /* Focus Styles */
  &:focus:not(:disabled),
  &[data-force-focus] {
    background-color: ${(props) => props.theme?.murv?.color.surface.neutral.pressed};
    border: 2px solid ${(props) => props.theme?.murv?.color.stroke.brand};
  }

  /* Active (on Pressed) Styles */
  &:active:not(:disabled),
  &[data-force-pressed] {
    background-color: ${(props) => props.theme?.murv?.color.surface.neutral.pressed};
    outline-offset: 2px;
  }

  /* Error State */
  &[data-error] {
    border: 2px solid ${(props) => props.theme?.murv?.color.stroke.danger};
    background-color: ${(props) => props.theme?.murv?.color.surface.neutral.default};
  }
`;

export const ButtonText = styled.div`
  /* Max Width */
  max-width: 280px;
  flex: 1;
  text-align: left;
  white-space: nowrap;
  width: max-content;
  overflow: hidden; /* Ensure overflow is hidden */
  text-overflow: ellipsis; /* Apply ellipsis for text truncation */
  white-space: nowrap; /* Prevent text from wrapping */
`;

/* TO DO : RE VISIT  AND MERGE THIS WITH BADGE */

export const StyledBadge = styled(Badge)<IStyledBadgeProps>`
  display: block;
  text-align: center;
  align-items: center;
  max-width: ${(props) => (props.maxBadgeWidth ? props.maxBadgeWidth : "75px")};
  overflow: hidden; /* Ensure overflow is hidden */
  text-overflow: ellipsis; /* Apply ellipsis for text truncation */
  white-space: nowrap; /* Prevent text from wrapping */
`;

/* Field wrapper styles */
export const FieldLabelContainer = styled.div<{
  compact: boolean;
  disabled: boolean;
  width?: string;
}>`
  color: ${({ theme, disabled }) =>
    disabled ? theme.murv.color.text.disabled : theme.murv.color.text.primary};
  width: ${({ width = "200px", compact }) => (compact ? "100%" : width)};
  display: flex;
  flex-direction: ${({ compact }) => (compact ? "row" : "column")};
  justify-content: space-between;
  gap: ${({ compact, theme }) => (compact ? theme.murv.spacing.xl : 0)};
  align-items: ${({ compact }) => (compact ? "center" : "flex-start")};
`;

export const FieldWrapper = styled.div<{
  width?: string;
  compact: boolean;
}>`
  display: flex;
  flex-direction: column;
  flex-grow: ${({ compact }) => (compact ? 0 : 1)};
  width: ${({ compact, width }) => (compact ? width : "100%")};
`;

export const HelpText = styled.div<{ isError: boolean; disabled: boolean }>`
  ${({ isError, disabled }) => {
    if (isError) {
      return css`
        color: ${({ theme }) => theme.murv.color.text.danger};
      `;
    }
    if (disabled) {
      return css`
        color: ${({ theme }) => theme.murv.color.text.disabled};
      `;
    }
    return css`
      color: ${({ theme }) => theme.murv.color.text.secondary};
    `;
  }}
  padding: ${({ theme }) => `0 ${theme.murv.spacing.m}`};
  margin-top: ${({ theme }) => theme.murv.spacing.s};
  display: flex;
  font-style: normal;
  line-height: ${({ theme }) => theme.murv.typography.subtext.s.lineHeight};
  font-weight: ${({ theme }) => theme.murv.typography.subtext.s.weight};
  font-size: ${({ theme }) => theme.murv.typography.subtext.s.size};
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`;
