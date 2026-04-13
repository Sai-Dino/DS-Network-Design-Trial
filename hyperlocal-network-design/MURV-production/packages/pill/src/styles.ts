import styled, { css, CSSObject, DefaultTheme } from "styled-components";

const breakpoints = {
  mobile: "480px",
};

const media = {
  mobile: (args: CSSObject) => css`
    @media (max-width: ${breakpoints.mobile}) {
      ${css(args)}
    }
  `,
};

const applyStyles = (
  theme: DefaultTheme,
  isSelected: boolean,
  isDisabled: boolean,
  type: "active" | "focus" | "hover" | "default",
) => {
  if (isDisabled) {
    return css`
      * {
        color: ${theme.murv.color.text.disabled};
      }
      background: ${theme.murv.color.surface.disabled.default};
      border: 2px solid ${theme.murv.color.surface.neutral.pressed};
      pointer-events: none;
    `;
  }
  const SELECTED_STYLES = {
    active: `
        background: ${theme.murv.color.surface.selected.pressed};
        border: 2px solid ${theme.murv.color.surface.selected.pressed};
      `,
    focus: `
        background: ${theme.murv.color.surface.selected.hover};
        border: 2px solid ${theme.murv.color.surface.brand.default};
      `,
    hover: `
        background: ${theme.murv.color.surface.selected.hover};
        border: 2px solid ${theme.murv.color.surface.selected.pressed};
      `,
    default: `
        background: ${theme.murv.color.surface.selected.default};
        border: 2px solid ${theme.murv.color.surface.selected.pressed};
      `,
  };
  const UN_SELECTED_STYLES = {
    hover: css`
      background: ${theme.murv.color.surface.neutral.hover};
      border: 2px solid ${theme.murv.color.surface.information.pressed};
    `,
    focus: css`
      background: ${theme.murv.color.surface.neutral.hover};
      border: 2px solid ${theme.murv.color.surface.brand.pressed};
    `,
    active: css`
      background: ${theme.murv.color.surface.neutral.hover};
      border: 2px solid ${theme.murv.color.surface.information.pressed};
    `,
    default: css`
      background: ${theme.murv.color.surface.neutral.default};
      border: 2px solid ${theme.murv.color.surface.neutral.pressed};
    `,
  };
  if (isSelected) {
    return css`
      ${SELECTED_STYLES[type]}
      color: ${theme.murv.color.surface.brand.default};
    `;
  }
  return UN_SELECTED_STYLES[type];
};

export const SmallPillContainer = styled.div<{
  selected?: boolean;
  disabled?: boolean;
}>`
    ${({ theme, selected = false, disabled = false }) =>
      applyStyles(theme, selected, disabled, "default")};
    width: fit-content;
    padding-left: ${({ theme }) => theme.murv.spacing.l};
    padding-right: ${({ theme }) => theme.murv.spacing.l};
    padding-bottom ${({ theme }) => theme.murv.spacing.xxs};
    padding-top: ${({ theme }) => theme.murv.spacing.xxs};
    border-radius: ${({ theme }) => theme.murv.spacing.xl};
    gap:${({ theme }) => theme.murv.spacing.xxs};
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    border: ${({ theme }) => theme.murv.spacing.xxxs} solid ${({ theme }) =>
      theme.murv.color.surface.neutral.pressed};
    &:hover {
      ${({ theme, selected = false, disabled = false }) =>
        applyStyles(theme, selected, disabled, "hover")}
    }
    &:focus {
      ${({ theme, selected = false, disabled = false }) =>
        applyStyles(theme, selected, disabled, "focus")}
    }
    &:active {
      ${({ theme, selected = false, disabled = false }) =>
        applyStyles(theme, selected, disabled, "active")}
    }
  `;

export const MediumPillContainer = styled(SmallPillContainer)`
  padding-bottom ${({ theme }) => theme.murv.spacing.xs};
  padding-top: ${({ theme }) => theme.murv.spacing.xs};
  border-radius: ${({ theme }) => theme.murv.spacing.xl};
  gap:${({ theme }) => theme.murv.spacing.s};
  `;

export const LargePillContainer = styled(SmallPillContainer)`
  padding-bottom ${({ theme }) => theme.murv.spacing.s};
  padding-top: ${({ theme }) => theme.murv.spacing.s};
  border-radius: ${({ theme }) => theme.murv.spacing.xl};
  gap:${({ theme }) => theme.murv.spacing.s};
  `;

export const Label = styled.label`
  width: max-content;
  font-size: ${({ theme }) => theme.murv.typography.body.sBold.size};
  font-weight: ${({ theme }) => theme.murv.typography.body.sBold.weight};
  line-height: ${({ theme }) => theme.murv.typography.heading.s.lineHeight};
  letter-spacing: ${({ theme }) => theme.murv.typography.heading.m.letterSpacing};
  ${({ theme }) => media.mobile({ fontSize: theme.murv.typography.body.s.size })};
`;

export const PrefixIconWrapper = styled.div`
  display: flex;
  align-items: center;
`;

export const SuffixIconWrapper = styled(PrefixIconWrapper)`
  cursor: pointer;
`;
