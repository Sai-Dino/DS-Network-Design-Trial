import styled, { css } from "styled-components";
import { ITabControlProps } from "./types";
import { TAB_VARIANTS } from "./constants";

type ITabStyleControlProps = Pick<ITabControlProps, "selected" | "disabled" | "variant">;

const TabIconsBase = styled.span<ITabStyleControlProps>`
  display: inline-flex;
  color: ${({ selected, theme }) =>
    selected ? theme.murv.color.text.brand : theme.murv.color.icon.secondary};

  /** Temporary. Will be removed when the icons component is built in the library */
  & > svg {
    height: ${({ variant }) => (variant === TAB_VARIANTS.DYNAMIC ? "16px" : "20px")};
    width: ${({ variant }) => (variant === TAB_VARIANTS.DYNAMIC ? "16px" : "20px")};
  }
`;

export const TabPrefixIconWrapper = styled(TabIconsBase)``;

export const TabSuffixIconWrapper = styled(TabIconsBase)`
  cursor: pointer;
`;

const TabCommonStyles = css<ITabStyleControlProps>`
  display: flex;
  position: relative;
  align-items: center;
  background-color: ${({ theme }) => theme.murv.color.surface.neutral.default};
  color: ${({ selected, theme }) =>
    selected ? theme.murv.color.text.brand : theme.murv.color.text.primary};
  border: none;
  outline: none;

  &:disabled {
    background-color: ${({ theme }) => theme.murv.color.surface.disabled.default};
    color: ${({ theme }) => theme.murv.color.text.disabled};

    & ${TabIconsBase} {
      color: ${({ theme }) => theme.murv.color.text.disabled};
    }
  }

  &:not(:disabled) {
    &:hover {
      background-color: ${({ theme }) => theme.murv.color.surface.neutral.hover};
    }

    &:focus-visible {
      background-color: ${({ theme }) => theme.murv.color.surface.neutral.hover};
      outline: ${({ theme }) =>
        `${theme.murv.color.stroke.brand} solid ${theme.murv.spacing.xxxs}`};
      border-radius: ${({ theme }) => theme.murv.radius.xs};
      z-index: 1;
      ${({ theme, selected }) =>
        selected
          ? ""
          : `box-shadow: -${theme.murv.spacing.xxxs} ${theme.murv.spacing.xxxs} 0px 0px ${theme.murv.color.stroke.inverse} inset,
            ${theme.murv.spacing.xxxs} -${theme.murv.spacing.xxxs} 0px 0px ${theme.murv.color.stroke.inverse} inset,
            ${theme.murv.spacing.xxxs} ${theme.murv.spacing.xxxs} 0px 0px ${theme.murv.color.stroke.inverse} inset,
            -${theme.murv.spacing.xxxs} -${theme.murv.spacing.xxxs} 0px 0px ${theme.murv.color.stroke.inverse} inset`};
    }

    &:active {
      background-color: ${({ theme }) => theme.murv.color.surface.neutral.pressed};
    }
  }
`;

const DefaultTabStyles = css<ITabStyleControlProps>`
  gap: ${({ theme }) => theme.murv.spacing.xs};
  padding: ${({ theme }) =>
    `${theme.murv.spacing.xl} ${theme.murv.spacing.l} ${theme.murv.spacing.l} ${theme.murv.spacing.l}`};
  line-height: ${({ theme }) => theme.murv.typography.body.s.lineHeight};
  font-size: ${({ theme }) => theme.murv.typography.body.s.size};

  &::before {
    content: "";
    position: absolute;
    display: block;
    bottom: 0;
    left: 0;
    right: 0;
    border-top-right-radius: ${({ theme }) => theme.murv.radius.xxs};
    border-top-left-radius: ${({ theme }) => theme.murv.radius.xxs};
    margin: ${({ theme }) => `0 ${theme.murv.spacing.l}`};
    margin-top: ${({ theme }) => theme.murv.spacing.s};

    border: ${({ theme, selected, disabled }) => {
      const baseBorderStyle = `${theme.murv.spacing.xxxs} solid `;
      if (selected) {
        if (disabled) {
          return `${baseBorderStyle} ${theme.murv.color.stroke.disabled}`;
        }
        return `${baseBorderStyle} ${theme.murv.color.stroke.brand}`;
      }
      return `${baseBorderStyle} transparent`;
    }};
  }
`;

const DynamicTabStyles = css<ITabStyleControlProps>`
  gap: ${({ theme }) => theme.murv.spacing.s};
  line-height: ${({ theme }) => theme.murv.typography.subtext.s.lineHeight};
  font-size: ${({ theme }) => theme.murv.typography.subtext.s.size};
  padding: ${({ theme }) => `${theme.murv.spacing.s} ${theme.murv.spacing.l}`};
  border-right: ${({ theme }) =>
    `${theme.murv.stroke.thin} solid ${theme.murv.color.skeleton.neutral}`};
  border-left: ${({ theme }) =>
    `${theme.murv.stroke.thin} solid ${theme.murv.color.skeleton.neutral}`};

  & ${TabSuffixIconWrapper} {
    ${({ selected }) => (selected ? "" : "display: none")};
  }

  &:not(:disabled) {
    &:hover,
    &:focus-visible {
      & ${TabSuffixIconWrapper} {
        display: inline-flex;
      }
    }
  }
`;

export const TabLabelWrapper = styled.span<ITabStyleControlProps>`
  display: inline-flex;
  margin: ${({ variant, theme }) =>
    `${variant === TAB_VARIANTS.DEFAULT ? theme.murv.spacing.xxxs : 0} 0`};
`;

export const TabBase = styled.button<ITabStyleControlProps>`
  ${TabCommonStyles}
  ${({ variant }) => (variant === TAB_VARIANTS.DYNAMIC ? DynamicTabStyles : DefaultTabStyles)};
`;

export const TabBarBase = styled.div`
  display: flex;
  padding: ${({ theme }) => `0 ${theme.murv.spacing.xxxl}`};
  border-bottom: ${({ theme }) =>
    `${theme.murv.stroke.standard} solid ${theme.murv.color.stroke.secondary}`};
`;

export const TabPanelWrapper = styled.div<{ selected: boolean }>`
  ${({ selected }) => (selected ? "" : "display: none;")}
`;
