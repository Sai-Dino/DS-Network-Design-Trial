import styled from "styled-components";
import { INavigationRailItemStyleProps } from "../../../types";

export const BadgeBlock = styled.span`
  display: flex;
  align-items: center;
  position: absolute;
  padding: ${(props) => `0 ${props.theme.murv.spacing.xs}`};
  transform: scale(1) translate(50%, -50%);
`;

export const IconBadgeBlock = styled(BadgeBlock)`
  transform: scale(1) translate(35%, -50%);
`;

export const LabelBadgeBlock = styled(BadgeBlock)`
  transform: scale(1) translate(75%, -50%);
`;

export const IconBlock = styled.div<INavigationRailItemStyleProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: ${(props) => `${props.theme.murv.spacing.xxxs} ${props.theme.murv.spacing.l}`};

  &[disabled] {
    pointer-events: none;
    user-select: none;
  }

  &:focus {
    border-radius: ${(props) => props.theme.murv.radius.l};
    background: ${(props) => props.theme.murv.color.surface.selected.default};
    outline: ${({ theme }) => `${theme.murv.stroke.thin} solid ${theme.murv.color.stroke.inverse}`};
  }

  &:active {
    border-radius: ${(props) => props.theme.murv.radius.l};
    background: ${(props) => props.theme.murv.color.surface.selected.pressed};
  }

  background: ${({ selected, disabled, theme }) =>
    selected
      ? theme.murv.color.surface.selected.default
      : (disabled && theme.murv.color.surface.disabled) || theme.murv.color.surface.neutral};
  border-radius: ${({ selected, theme }) => selected && theme.murv.radius.l};
`;

export const ItemLabelBlock = styled.div<INavigationRailItemStyleProps>`
  display: flex;
  flex-direction: column;
  align-self: stretch;
  align-items: center;
  gap: ${(props) => props.theme.murv.spacing.xxxs};
  &[disabled] {
    pointer-events: none;
    user-select: none;
  }
`;

export const RailItemLabel = styled.div`
  max-height: 32px;
  align-self: stretch;
  text-align: center;
  font-size: ${(props) => props.theme.murv.typography.subtext.s.size};
  font-weight: ${(props) => props.theme.murv.typography.subtext.s.weight};
  line-height: ${(props) => props.theme.murv.typography.subtext.s.lineHeight};
`;
