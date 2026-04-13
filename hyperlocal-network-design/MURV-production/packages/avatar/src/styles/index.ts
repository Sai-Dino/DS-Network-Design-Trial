import styled from "styled-components";
import { Badge } from "@murv/badge";
import { StyledAvatarProps } from "../types";

export const StyledAvatar = styled.div<StyledAvatarProps>`
  border: ${(props) => `2px solid ${props.theme.murv.color.stroke.primary}`};
  border-radius: ${(props) => props.theme.murv.radius.xxl};
  background-color: ${(props) =>
    props.type === "image" ? "transparent" : props.theme.murv.color.surface.brand.default};
  color: ${(props) =>
    props.type === "image" ? "initial" : props.theme.murv.color.surface.neutral.default};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  text-align: center;
  vertical-align: middle;

  ${(props) => {
    switch (props.type) {
      case "text":
        switch (props.size) {
          case "small":
            return `
              font-size: ${props.theme.murv.typography.subtext.s.size};
              font-weight: ${props.theme.murv.typography.subtext.s.weight};
              line-height: ${props.theme.murv.typography.subtext.s.lineHeight};
              letter-spacing: ${props.theme.murv.typography.subtext.s.letterSpacing};
            `;
          case "medium":
            return `
              font-size: ${props.theme.murv.typography.body.sBold.size};
              font-weight: ${props.theme.murv.typography.body.sBold.weight};
              line-height: ${props.theme.murv.typography.body.sBold.lineHeight};
            `;
          case "large":
            return `
              font-size: ${props.theme.murv.typography.heading.s.size};
              font-weight: ${props.theme.murv.typography.heading.s.weight};
              line-height:  ${props.theme.murv.typography.heading.s.lineHeight};
              letter-spacing: -${props.theme.murv.typography.heading.s.letterSpacing};
            `;
          default:
            return `
              font-size: ${props.theme.murv.typography.heading.s.size};
              font-weight: ${props.theme.murv.typography.body.sBold.weight};
              line-height: ${props.theme.murv.typography.body.sBold.lineHeight};
            `;
        }
      default:
        return "";
    }
  }}

  width: ${(props) => {
    switch (props.size) {
      case "small":
        return "24px";
      case "medium":
        return "32px";
      case "large":
        return "48px";
      default:
        return "32px";
    }
  }};

  height: ${(props) => {
    switch (props.size) {
      case "small":
        return "24px";
      case "medium":
        return "32px";
      case "large":
        return "48px";
      default:
        return "32px";
    }
  }};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: inherit;
  }
`;

export const StyledBadge = styled(Badge)`
  position: absolute;
  top: -3px;
  right: -4px;
  z-index: ${(props) => props.theme.murv.zIndex.level99};
`;
