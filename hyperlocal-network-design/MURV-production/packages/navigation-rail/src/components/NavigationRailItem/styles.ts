import styled from "styled-components";
import { INavigationRailItemStyleProps } from "../../types";

export const NavigationRailItemWrapper = styled.button<INavigationRailItemStyleProps>`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: ${({ theme }) => theme.murv.spacing.xxxs};
  align-self: stretch;
  justify-content: center;
  padding: ${(props) => `${props.theme.murv.spacing.s} ${props.theme.murv.spacing.xxs}`};
  cursor: pointer;
  border: none;
  text-decoration: none;
  background: ${(props) =>
    props.disabled
      ? props.theme.murv.color.surface.disabled.default
      : props.theme.murv.color.surface.neutral.default};

  &:hover {
    background: ${(props) => !props.disabled && props.theme.murv.color.surface.neutral.hover};
  }

  &:focus {
    border-radius: ${(props) => props.theme.murv.radius.xxs};
    outline: 2px solid ${({ theme }) => theme.murv.color.stroke.brand};
  }

  color: ${({ selected, disabled, theme }) =>
    selected
      ? theme.murv.color.text.brand
      : (disabled && theme.murv.color.text.disabled) || theme.murv.color.text.primary};

  &[disabled] {
    pointer-events: none;
    user-select: none;
  }
`;

// Anchor variant to guarantee an actual <a> tag when a url is provided.
export const NavigationRailLinkWrapper = NavigationRailItemWrapper.withComponent("a");
