import styled, { css, DefaultTheme } from "styled-components";
import { IStyledCardProps } from "../types";

const applyStyles = (
  theme: DefaultTheme,
  interactable: boolean,
  disabled: boolean,
  type: "active" | "focus" | "hover" | "default" | "pressed",
) => {
  if (!interactable) {
    return css`
      cursor: "default";
      pointer-events: none;
      border: 2px solid ${theme.murv.color.stroke.primary};
    `;
  }
  if (disabled) {
    return css`
      cursor: "default";
      pointer-events: none;
      background: ${theme.murv.color.surface.disabled.default};
      border: 2px solid ${theme.murv.color.stroke.disabled};
    `;
  }
  const STYLES = {
    active: `
      cursor: "pointer";
      background: ${theme.murv.color.surface.neutral.hover};
      border: 2px solid ${theme.murv.color.stroke.brand};
    `,
    focus: `
      cursor: "pointer";
      background: ${theme.murv.color.surface.neutral.hover};
      border: 2px solid ${theme.murv.color.stroke.brand};
    `,
    hover: `
      cursor: "pointer";
      background: ${theme.murv.color.surface.neutral.hover};
      border: 2px solid ${theme.murv.color.stroke.primary};
    `,
    default: `
      cursor: "pointer";
      border: 2px solid ${theme.murv.color.stroke.primary};
    `,
    pressed: `
      cursor: "pointer";
      background: ${theme.murv.color.surface.neutral.pressed};
      border: 2px solid ${theme.murv.color.stroke.primary};
    `,
  };
  return css`
    ${STYLES[type]}
  `;
};

export const StyledCard = styled.div<IStyledCardProps>`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  border: 1px solid #ccc;
  color: ${({ theme }) => theme.murv.color.text.primary};
  padding: ${({ theme }) => theme.murv.spacing.l};
  border-radius: ${({ theme }) => theme.murv.radius.xl};
  ${({ theme, interactable = true, disabled = false }) =>
    applyStyles(theme, interactable, disabled, "default")};
  &:hover {
    ${({ theme, interactable = true, disabled = false }) =>
      applyStyles(theme, interactable, disabled, "hover")}
  }
  &:focus {
    ${({ theme, interactable = true, disabled = false }) =>
      applyStyles(theme, interactable, disabled, "focus")}
  }
  &:active {
    ${({ theme, interactable = true, disabled = false }) =>
      applyStyles(theme, interactable, disabled, "pressed")}
  }
  &:selected {
    ${({ theme, interactable = true, disabled = false }) =>
      applyStyles(theme, interactable, disabled, "active")}
  }
`;

export const StyledHeaderContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  gap: ${({ theme }) => theme.murv.spacing.s};
  padding: ${({ theme }) => theme.murv.spacing.s};
  width: 100%;
`;

export const StyledHeaderIconTitleContainer = styled.div`
  display: flex;
  flex: 1 0 0;
  gap: ${({ theme }) => theme.murv.spacing.xl};
  align-items: center;
`;

export const StyledHeaderIconContainer = styled.div`
  width: ${({ theme }) => theme.murv.typography.body.sBold.lineHeight};
  height: ${({ theme }) => theme.murv.typography.body.sBold.lineHeight};
`;

export const StyledHeaderTitleContainer = styled.div`
  flex: 1;
  align-items: stretch;
  color: ${({ theme }) => theme.murv.color.text.primary};
  font-size: ${({ theme }) => theme.murv.typography.body.sBold.size};
  font-weight: ${({ theme }) => theme.murv.typography.body.sBold.weight};
  line-height: ${({ theme }) => theme.murv.typography.body.sBold.lineHeight};
  font-style: normal;
`;

export const StyledHeaderTagContainer = styled.div`
  display: flex;
  align-items: flex-start;
`;

export const StyledHeaderMenuContainer = styled.div`
  display: flex;
  align-items: flex-start;
`;

export const StyledBodyContainer = styled.div`
  display: flex;
  flex: 1;
  width: 100%;
  justify-content: center;
  align-items: flex-start;
  flex-direction: column;
`;

export const StyledImageHolder = styled.div`
  display: flex;
  flex: 1;
`;
export const StyledLinkHolder = styled.div`
  display: flex;
  flex: 1;
`;
export const StyledCarousalContainer = styled.div`
  display: flex;
  flex: 1;
`;
export const StyledVideoContainer = styled.div`
  display: flex;
  flex: 1;
`;
export const StyledTextBlockContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
`;

export const StyledPrimaryLineContainer = styled.div`
  display: flex;
  align-items: center;
  flex-direction: row;
`;

export const StyledSecondaryLineContainer = styled.div`
  display: flex;
  align-items: center;
  flex-direction: row;
`;

export const StyledTertiaryLineContainer = styled.div`
  display: flex;
  align-items: center;
  flex-direction: row;
`;

export const StyledHorizontalItemsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex: 1;
  flex-direction: row;
  align-items: center;
  width: 100%;
  gap: ${({ theme }) => theme.murv.spacing.s};
`;

export const StyledVerticalItemsContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  width: 100%;
`;

export const StyledHorizontalItemSlotContainer = styled.div`
  display: flex;
  padding: ${({ theme }) => theme.murv.spacing.s};
  gap: ${({ theme }) => theme.murv.spacing.xxxs};
`;

export const StyledVerticalItemSlotContainer = styled.div`
  display: flex;
  padding: ${({ theme }) => theme.murv.spacing.s};
  gap: ${({ theme }) => theme.murv.spacing.xxxs};
`;
