import styled, { css } from "styled-components";

interface ButtonProps {
  selected: boolean;
}

export const PaginationSelectContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.murv.spacing.s};
  justify-content: space-between;
  ${({ theme }) => `padding: ${theme.murv.spacing.s} ${theme.murv.spacing.xxl}`};
  min-height: 40px;
  max-height: 40px;
  margin-top: 10px;
`;

export const PaginatorContainer = styled.div`
  display: flex;
  align-items: center;
`;

export const PageNumberContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const PageSelectorContainer = styled.div``;

const buttonBaseStyles = css`
  padding: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  outline: none;
  transition:
    background-color 0.3s ease,
    color 0.3s ease,
    border-radius 0.3s ease,
    border-color 0.3s ease;
`;

export const UnitButton = styled.button<ButtonProps>`
  ${buttonBaseStyles}
  background-color: ${({ selected, theme }) =>
    !selected ? "transparent" : theme.murv.color.surface.selected.default};
  border-radius: ${({ selected, theme }) => (selected ? theme.murv.spacing.s : "0")};
  color: ${({ selected, theme }) =>
    selected ? theme.murv.color.surface.brand.default : theme.murv.color.text.primary};
  min-width: 32px;
  min-height: 32px;

  &:hover {
    background-color: ${({ selected, theme }) =>
      selected ? theme.murv.color.surface.selected.hover : theme.murv.color.surface.neutral.hover};
    border-radius: ${({ theme }) => theme.murv.spacing.s};
    color: ${({ theme }) => theme.murv.color.surface.brand.default};
  }

  &:active {
    border-color: ${({ theme }) => theme.murv.color.surface.brand.default};
    background-color: ${({ selected, theme }) =>
      selected
        ? theme.murv.color.surface.selected.pressed
        : theme.murv.color.surface.selected.hover};
    border-radius: ${({ selected, theme }) => (selected ? theme.murv.spacing.s : "0")};
    color: ${({ theme }) => theme.murv.color.surface.brand.default};
  }

  &:focus {
    border: 2px solid ${({ theme }) => theme.murv.color.surface.brand.default};
    background-color: ${({ selected, theme }) =>
      selected ? theme.murv.color.surface.selected.hover : theme.murv.color.surface.neutral.hover};
    border-radius: ${({ selected, theme }) =>
      selected ? theme.murv.spacing.s : theme.murv.spacing.s};
    color: ${({ selected, theme }) =>
      selected ? theme.murv.color.text.brand : theme.murv.color.text.primary};
  }

  &:disabled {
    background-color: ${({ selected, theme }) =>
      selected ? theme.murv.color.surface.disabled.default : "transparent"};
    color: ${({ theme }) => theme.murv.color.text.disabled};
  }
`;
