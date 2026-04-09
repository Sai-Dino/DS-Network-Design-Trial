import styled, { css } from "styled-components";
import { INavigationRailWrapperProps } from "./types";
import { ORIENTATION } from "./constants";

export const NavigationRailWrapper = styled.nav<INavigationRailWrapperProps>`
  display: flex;
  gap: ${(props) => props.theme.murv.spacing.s};
  align-items: center;
  padding: ${(props) => props.theme.murv.spacing.s} ${(props) => props.theme.murv.spacing[0]};

  ${({ orientation, theme }) => {
    if (orientation === ORIENTATION.HORIZONTAL) {
      return css`
        flex-direction: row;
        border-bottom: 1px solid ${theme.murv.color.stroke.primary};
        justify-content: space-around;
      `;
    }
    return css`
      flex-direction: column;
      border-right: 1px solid ${theme.murv.color.stroke.primary};
      width: 80px;
      height: 100%;
    `;
  }}
`;

export const MoreButton = styled.button`
  width: 100%;
  border: none;

  &:hover {
    background: ${(props) => !props.disabled && props.theme.murv.color.surface.neutral.hover};
  }
`;
