import styled, { css } from "styled-components";

const breakpoint = {
  mobile: "480px",
};

interface TagContainerProps {
  tagStyle:
    | "red"
    | "yellow"
    | "green"
    | "black"
    | "grey"
    | "success"
    | "submitted"
    | "rejected"
    | "pending"
    | "expired";
  alignment: "regular" | "left";
  backgroundColor?: string;
  textColor?: string;
}

export const TagContainer = styled.div<TagContainerProps>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: max-content;
  padding-inline: ${({ theme }) => theme.murv.spacing.s};
  border-radius: ${({ alignment, theme }) =>
    alignment === "regular"
      ? theme.murv.radius.xs
      : `0 ${theme.murv.radius.xs} ${theme.murv.radius.xs} 0`};

  ${({ tagStyle, backgroundColor, textColor }) => {
    if (backgroundColor && textColor) {
      return css`
        color: ${textColor};
        background: ${backgroundColor};
      `;
    }
    switch (tagStyle) {
      case "red":
        return css`
          background: ${({ theme }) => theme.murv.color.tag.promotion};
          color: ${({ theme }) => theme.murv.color.icon.inverse};
        `;
      case "yellow":
        return css`
          background: ${({ theme }) => theme.murv.color.tag.saving};
          color: ${({ theme }) => theme.murv.color.icon.primary};
        `;

      case "green":
        return css`
          background: ${({ theme }) => theme.murv.color.tag.combo};
          color: ${({ theme }) => theme.murv.color.icon.inverse};
        `;
      case "black":
        return css`
          background: ${({ theme }) => theme.murv.color.tag.recommended};
          color: ${({ theme }) => theme.murv.color.icon.inverse};
        `;
      case "grey":
        return css`
          background: ${({ theme }) => theme.murv.color.tag.category};
          color: ${({ theme }) => theme.murv.color.icon.primary};
        `;
      case "success":
        return css`
          background: ${({ theme }) => theme.murv.color.surface.success.default};
          color: ${({ theme }) => theme.murv.color.icon.primary};
        `;
      case "submitted":
        return css`
          background: ${({ theme }) => theme.murv.color.surface.selected.default};
          color: ${({ theme }) => theme.murv.color.icon.primary};
        `;
      case "rejected":
        return css`
          background: ${({ theme }) => theme.murv.color.surface.danger.default};
          color: ${({ theme }) => theme.murv.color.icon.primary};
        `;
      case "pending":
        return css`
          background: ${({ theme }) => theme.murv.color.surface.warning.default};
          color: ${({ theme }) => theme.murv.color.icon.primary};
        `;
      case "expired":
        return css`
          background: ${({ theme }) => theme.murv.color.surface.information.default};
          color: ${({ theme }) => theme.murv.color.icon.primary};
        `;
      default:
        return css`
          background: ${({ theme }) => theme.murv.color.surface.selected.default};
          color: ${({ theme }) => theme.murv.color.text.primary};
        `;
    }
  }}

  @media (max-width: ${breakpoint.mobile}) {
    padding-inline: ${({ theme }) => theme.murv.spacing.xxs};
  }
`;

export const TagText = styled.div`
  font-size: ${({ theme }) => theme.murv.typography.body.s.size};
  font-weight: ${({ theme }) => theme.murv.typography.subtext.s.weight};
  line-height: ${({ theme }) => theme.murv.typography.body.s.lineHeight};
  letter-spacing: ${({ theme }) => theme.murv.typography.body.s.letterSpacing};
`;
