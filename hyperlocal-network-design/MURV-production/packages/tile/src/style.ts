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

const applyStyles = (theme: DefaultTheme, isSelected: boolean, isDisabled: boolean) => {
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
    active: css`
      background: ${theme.murv.color.surface.selected.pressed};
      border: 2px solid ${theme.murv.color.surface.selected.pressed};
    `,
    focus: css`
      background: ${theme.murv.color.surface.selected.hover};
      border: 2px solid ${theme.murv.color.surface.brand.default};
    `,
    hover: css`
      background: ${theme.murv.color.surface.selected.hover};
      border: 2px solid ${theme.murv.color.surface.selected.pressed};
    `,
    default: css`
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
      background: ${theme.murv.color.surface.neutral.pressed};
      border: 2px solid ${theme.murv.color.surface.information.pressed};
    `,
    default: css`
      background: ${theme.murv.color.surface.neutral.default};
      border: 2px solid ${theme.murv.color.surface.neutral.pressed};
    `,
  };
  return css`
    ${() => (isSelected ? SELECTED_STYLES.default : UN_SELECTED_STYLES.default)}
    &:hover {
      ${() => (isSelected ? SELECTED_STYLES.hover : UN_SELECTED_STYLES.hover)}
    }
    &:focus {
      ${() => (isSelected ? SELECTED_STYLES.focus : UN_SELECTED_STYLES.focus)}
    }
    &:active {
      ${() => (isSelected ? SELECTED_STYLES.active : UN_SELECTED_STYLES.active)}
    }
    cursor: pointer;
  `;
};

export const TileContainer = styled.div<{
  selected?: boolean;
  disabled?: boolean;
  width?: string;
}>`
  ${({ theme, selected = false, disabled = false }) => applyStyles(theme, selected, disabled)};
  min-width: 120px;
  width: ${({ width }) => width || "fit-content"};
  padding: ${({ theme }) => theme.murv.spacing.m};
  border-radius: ${({ theme }) => theme.murv.radius.m};
  display: flex;
  flex-direction: column;
  min-width: 100px;
`;

export const HeaderContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.murv.spacing.m};
  align-items: center;
  .__tile__header__icon {
    pointer-events: auto;
  }
`;

export const Heading = styled.h3`
  font-size: ${({ theme }) => theme.murv.typography.heading.l.size};
  font-weight: ${({ theme }) => theme.murv.typography.heading.s.weight};
  line-height: ${({ theme }) => theme.murv.typography.heading.s.lineHeight};
  ${({ theme }) => media.mobile({ fontSize: theme.murv.typography.heading.l.size })};
`;

export const IconWrapper = styled.div`
  margin-left: auto;
  cursor: pointer;
`;

export const Label = styled.label`
  font-size: ${({ theme }) => theme.murv.typography.body.s.size};
  font-weight: 400;
  line-height: ${({ theme }) => theme.murv.typography.heading.m.lineHeight};
  letter-spacing: ${({ theme }) => theme.murv.typography.heading.m.letterSpacing};
  ${({ theme }) => media.mobile({ fontSize: theme.murv.typography.body.s.size })};
`;

export const Description = styled.span<{ disabled?: boolean }>`
  font-size: ${({ theme }) => theme.murv.typography.subtext.s.size};
  color: ${({ theme, disabled }) =>
    disabled ? theme.murv.color.text.disabled : theme.murv.color.surface.inverse.pressed};
  ${({ theme }) => media.mobile({ fontSize: theme.murv.typography.subtext.s.size })};
`;
