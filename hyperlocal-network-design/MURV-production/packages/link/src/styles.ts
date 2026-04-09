import styled, { css } from "styled-components";
import { ILinkStyleProps } from "./types";
import { PREESED, HOVERED, DISABLED } from "./constants";

/**
 * Templates
 */

const getCommonCssForText = () => css`
  font-size: ${({ theme }) => theme.murv.typography.heading.m.size};
  font-weight: ${({ theme }) => theme.murv.typography.heading.m.weight};
  line-height: ${({ theme }) => theme.murv.typography.heading.m.lineHeight};
`;
export const Para = styled.p`
  ${() => getCommonCssForText()};
`;

const applyStyles = ({ linkState, styles, caption, theme }: ILinkStyleProps) =>
  css`
    ${caption && `border-bottom: 1px solid transparent`};
    ${!caption &&
    `    border-bottom: 1px ${theme.murv.color.surface.brand.default};
         border-bottom-style: ${caption ? "" : "dashed"};
    `};
    ${styles};
    ${linkState === HOVERED && `color: ${theme.murv.color.text.brand}`};
    ${linkState === DISABLED &&
    `
         pointer-events: none;
         color: ${theme.murv.color.text.disabled};
         border-bottom: 1px ${theme.murv.color.surface.disabled.default};
    `};
    ${linkState === PREESED &&
    `
        color: ${theme.murv.color.text.disabled};
    `};
    // This is done because whenever link is clicked, it is focused and we have different styled for focus and pressed states
    ${linkState !== PREESED &&
    `&:focus {
         outline: none;
         color: ${theme.murv.color.text.brand};
         border:  ${theme.murv.spacing.xxxs} solid ${theme.murv.color.surface.brand.default};
         border-radius: ${theme.murv.spacing.s};
    };`}
  `;
export const StyledAnchor = styled.a<ILinkStyleProps>`
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 0px 1px;
  text-decoration: none;
  cursor: pointer;
  border-bottom: 1px solid transparent;

  color: ${({ theme }) => theme.murv.color.text.primary};
  ${() => getCommonCssForText()};
  ${(props: ILinkStyleProps) => applyStyles(props)};
`;

export const IconWrapper = styled.span`
  display: flex;
  padding-left: ${({ theme }) => theme.murv.spacing.s};
`;
