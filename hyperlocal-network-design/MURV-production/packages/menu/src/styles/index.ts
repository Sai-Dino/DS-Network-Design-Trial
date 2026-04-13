import styled, { css } from "styled-components";
import { IMenuItemStyled } from "../types";

export const MenuWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  width: max-content;
  min-width: 200px;
  max-width: 280px;
`;

const menuItemStyles = css<{ disabled?: boolean; isActionable?: boolean }>`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => `${theme.murv.spacing.s} ${theme.murv.spacing.xl}`};
  width: 100%;
  cursor: pointer;
  color: ${(props) =>
    props.isActionable ? props.theme.murv.color.text.brand : props.theme.murv.color.text.primary};
  font-size: ${(props) => props.theme.murv.typography.body.s.size};
  font-weight: ${(props) => props.theme.murv.typography.body.s.weight};
  line-height: ${(props) => props.theme.murv.typography.body.s.lineHeight};
  letter-spacing: ${(props) => props.theme.murv.typography.body.s.letterSpacing};
  border-radius: ${({ theme }) => `${theme.murv.spacing.xxxs}`};
  border: ${({ theme }) =>
    `${theme.murv.stroke.standard} solid ${theme.murv.color.stroke.inverse}`};
  text-decoration: none;

  &:hover {
    background-color: ${({ theme }) => theme.murv.color.surface.neutral.hover};
  }

  &:active {
    background-color: ${({ theme }) => theme.murv.color.surface.neutral.pressed};
    border: ${({ theme }) =>
      `${theme.murv.stroke.standard} solid ${theme.murv.color.stroke.secondary}`};
  }

  &[disabled] {
    background-color: ${({ theme }) => theme.murv.color.surface.disabled.default};
    border: ${({ theme }) =>
      `${theme.murv.stroke.standard} solid ${theme.murv.color.surface.disabled.default}`};
    pointer-events: none;
    user-select: none;
    opacity: ${({ theme }) => theme.murv.opacity.disabled};
  }

  svg {
    flex-shrink: 0;
  }
`;

export const MenuItemWrapper = styled.div<{ disabled?: boolean; isActionable?: boolean }>`
  ${menuItemStyles}
`;

export const MenuItemLinkWrapper = styled.a<{ disabled?: boolean; isActionable?: boolean }>`
  ${menuItemStyles}
`;

export const MenuTitleWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => `${theme.murv.spacing.xs} ${theme.murv.spacing.xl}`};
  gap: ${({ theme }) => `${theme.murv.spacing.xs}`};

  width: 100%;
  color: ${(props) => props.theme.murv.color.text.secondary};
  font-size: ${(props) => props.theme.murv.typography.subtext.s.size};
  font-weight: ${(props) => props.theme.murv.typography.subtext.s.weight};
  line-height: ${(props) => props.theme.murv.typography.subtext.s.lineHeight};
  letter-spacing: ${(props) => props.theme.murv.typography.subtext.s.letterSpacing};

  svg {
    cursor: pointer;
    flex-shrink: 0;
  }
`;

export const ItemLabelWrapper = styled.div`
  display: flex;
  gap: ${({ theme }) => `${theme.murv.spacing.l}`};
  margin-right: ${({ theme }) => `${theme.murv.spacing.s}`};
  align-items: start;
  flex-grow: 1;
  pointer-events: none;

  overflow: hidden;
`;

export const TitleText = styled.div`
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

export const MenuItemText = styled.div<IMenuItemStyled>`
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  ${({ isHeaderMenu }) => isHeaderMenu && `font-weight: 400`};
`;

export const MenuItemsContainer = styled.div`
  display: flex;
  flex-direction: column;

  overflow-y: auto;
  overflow-x: hidden;

  width: 100%;
`;

export const IconBtn = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  outline: none;
  border: none;
  background: none;
  padding: 0;
`;
