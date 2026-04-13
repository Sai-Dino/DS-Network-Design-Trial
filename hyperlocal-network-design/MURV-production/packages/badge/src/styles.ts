import styled, { DefaultTheme } from "styled-components";

// TODO: Replace with theme token
const breakpoint = {
  mobile: "480px",
};

const getBackgroundColor = (
  type: "highlight" | "subtle" | "brand",
  disabled: boolean,
  theme: DefaultTheme,
): string => {
  if (disabled) {
    return theme.murv.color.surface.disabled.pressed;
  }
  switch (type) {
    case "highlight":
      return theme.murv.color.tag.promotion;
    case "brand":
      return theme.murv.color.icon.information;
    case "subtle":
      return theme.murv.color.tag.category;
    default:
      return theme.murv.color.tag.category;
  }
};

const getTextColor = (
  type: "highlight" | "subtle" | "brand",
  disabled: boolean,
  theme: DefaultTheme,
): string => {
  if (disabled) {
    return theme.murv.color.text.disabled;
  }
  switch (type) {
    case "highlight":
      return theme.murv.color.text.inverse;
    case "brand":
      return theme.murv.color.text.inverse;
    case "subtle":
      return theme.murv.color.text.secondary;
    default:
      return theme.murv.color.text.inverse;
  }
};

interface StyleBadgeProps {
  type: "highlight" | "subtle" | "brand";
  isValidContent: boolean;
  disabled: boolean;
}

export const StyledBadge = styled.div<StyleBadgeProps>`
  display: flex;
  justify-content: center;
  align-items: center;

  height: ${({ isValidContent, theme }) =>
    isValidContent ? theme.murv.typography.subtext.s.lineHeight : theme.murv.spacing.xs};
  width: ${({ isValidContent, theme }) => (isValidContent ? "max-content" : theme.murv.spacing.xs)};
  padding-inline: ${({ theme, isValidContent }) =>
    isValidContent ? theme.murv.spacing.xxs : "none"};

  color: ${({ type, disabled, theme }) => getTextColor(type, disabled, theme)};
  background-color: ${({ type, disabled, theme }) => getBackgroundColor(type, disabled, theme)};

  border-radius: 100px;
  outline: ${({ theme }) => `${theme.murv.stroke.thin} solid ${theme.murv.color.stroke.inverse}`};

  font-size: ${({ theme }) => theme.murv.typography.subtext.s.size};
  font-weight: ${({ theme }) => theme.murv.typography.body.s.weight};
  line-height: ${({ theme }) => theme.murv.typography.subtext.s.lineHeight};
  letter-spacing: ${({ theme }) => theme.murv.typography.body.s.letterSpacing};

  @media (max-width: ${breakpoint.mobile}) {
    height: ${({ isValidContent, theme }) =>
      isValidContent ? theme.murv.typography.subtext.s.lineHeight : theme.murv.spacing.xxs};
    width: ${({ isValidContent, theme }) =>
      isValidContent ? "max-content" : theme.murv.spacing.xxs};

    outline: ${({ isValidContent, theme }) =>
      isValidContent
        ? `${theme.murv.stroke.thin} solid ${theme.murv.color.stroke.inverse}`
        : "none"};
  }
`;
