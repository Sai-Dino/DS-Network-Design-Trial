import styled from "styled-components";
import { IHeaderStyleProps } from "../types";

const breakpoint = {
  mobile: "480px",
};

export const AccordionView = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden;

  &:focus-within {
    box-shadow: 0px 0px 0px 2px ${(props) => props.theme.murv.color.icon.brand};
  }

  border-radius: ${(props) => props.theme.murv.radius.m};
  border: ${(props) => props.theme.murv.stroke.standard} solid
    ${(props) => props.theme.murv.color.stroke.primary};

  &[open] summary #accordion-toggle-icon {
    transform: rotate(180deg);
  }

  & summary::-webkit-details-marker {
    display: none;
  }
  & summary::marker {
    content: "";
  }
`;

export const AccordionHeaderView = styled.div<IHeaderStyleProps>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${(props) => props.theme.murv.spacing.xl};
  cursor: default;
  outline-color: transparent;
  tabindex: 0;

  &[aria-expanded="true"] #accordion-toggle-icon {
    transform: rotate(180deg);
    transition: transform 0.2s ease-in-out;
  }

  &:hover {
    background: ${(props) => !props.disabled && props.theme.murv.color.surface.information.hover};
  }

  &:active {
    background: ${(props) => !props.disabled && props.theme.murv.color.surface.information.pressed};
  }
  background: ${(props) =>
    props.disabled
      ? props.theme.murv.color.surface.disabled.default
      : props.theme.murv.color.surface.information.default};

  padding: ${(props) => props.theme.murv.spacing.l} ${(props) => props.theme.murv.spacing.xl};

  @media (max-width: ${breakpoint.mobile}) {
    padding: ${(props) => props.theme.murv.spacing.s} ${(props) => props.theme.murv.spacing.l};
    gap: ${(props) => props.theme.murv.spacing.s};
  }

  &[disabled] {
    pointer-events: none;
    user-select: none;
  }
`;

export const BadgeWrapper = styled.div`
  display: flex;
  margin-top: ${(props) => props.theme.murv.spacing.xxs};
`;

export const IconWrapper = styled.div`
  display: flex;
  margin-top: ${(props) => props.theme.murv.spacing.xxs};
`;

export const ToggleIconWrapper = styled.div`
  display: flex;
  min-width: 20px;
  min-height: 20px;
  transition: transform 0.2s ease-in-out;
`;

export const MainInfoView = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export const PrimaryInfoView = styled.div`
  display: flex;
  color: ${(props) => props.theme.murv.color.text.primary};
  font-size: ${(props) => props.theme.murv.typography.heading.m.size};
  font-weight: ${(props) => props.theme.murv.typography.heading.m.weight};
  line-height: ${(props) => props.theme.murv.typography.heading.m.lineHeight};
  letter-spacing: ${(props) => props.theme.murv.typography.heading.m.letterSpacing};
`;

export const SecondaryInfoView = styled.div`
  display: flex;
  color: ${(props) => props.theme.murv.color.text.primary};
  font-size: ${(props) => props.theme.murv.typography.body.s.size};
  font-weight: ${(props) => props.theme.murv.typography.subtext.s.weight};
  line-height: ${(props) => props.theme.murv.typography.body.s.lineHeight};
  letter-spacing: ${(props) => props.theme.murv.typography.body.s.letterSpacing};
`;

export const TertiaryInfoView = styled.div`
  display: flex;

  color: ${(props) => props.theme.murv.color.text.secondary};
  font-size: ${(props) => props.theme.murv.typography.body.s.size};
  font-weight: ${(props) => props.theme.murv.typography.subtext.s.weight};
  line-height: ${(props) => props.theme.murv.typography.body.s.lineHeight};
  letter-spacing: ${(props) => props.theme.murv.typography.body.s.letterSpacing};
`;

export const LeftContent = styled.div`
  display: flex;
  align-items: start;
  gap: ${(props) => props.theme.murv.spacing.s};

  @media (max-width: ${breakpoint.mobile}) {
    gap: ${(props) => props.theme.murv.spacing.s};
  }
`;

export const RightContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.murv.spacing.xl};
  @media (max-width: ${breakpoint.mobile}) {
    gap: ${(props) => props.theme.murv.spacing.s};
  }
`;

export const ToggleWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  padding: ${(props) => props.theme.murv.spacing.s};
`;

export const AccordionContentView = styled.div`
  display: flex;

  padding: ${(props) => props.theme.murv.spacing.xl};
  border-top: ${(props) => props.theme.murv.stroke.standard} solid
    ${(props) => props.theme.murv.color.stroke.primary};
`;

export const AccordionGroupView = styled.div<{ gap: string }>`
  display: flex;
  flex-direction: column;
  gap: ${({ gap }) => gap};
`;
