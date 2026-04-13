import styled, { css, CSSObject } from "styled-components";
import { Badge } from "@murv/badge";

const breakpoints = {
  mobile: "480px",
};

const media = {
  mobile: (args: CSSObject) => css`
    @media (max-width: ${breakpoints.mobile}) {
      ${css(args)}
    }
  `,
};

export const StarContainer = styled.div<{
  readOnly: boolean;
}>`
  position: relative;
  display: inline-block;
  width: 20px;
  height: 20px;
  cursor: ${(props) => (props.readOnly ? "text" : "pointer")};
  margin: ${({ theme, readOnly }) => (readOnly ? "0" : theme.murv.spacing.s)};
  ${({ theme }) => media.mobile({ fontSize: theme.murv.typography.body.s.size })};

  &::before {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: rgba(128, 128, 128, 0.3);
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.3s ease;
    transform: scale(1.4);
    transform-origin: center;
  }

  &:hover::before {
    opacity: 1;
  }

  .visuallyhidden {
    border: 0;
    overflow: hidden;
    padding: 0;
    position: absolute;
    width: 1px;
    white-space: nowrap;
  }
`;

export const RatingWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${({ theme }) => theme.murv.spacing.m};
  ${({ theme }) => media.mobile({ fontSize: theme.murv.typography.body.s.size })};
`;

export const StyledBadge = styled(Badge)`
  margin-top: ${({ theme }) => theme.murv.spacing.m};
  ${({ theme }) => media.mobile({ fontSize: theme.murv.typography.body.s.size })};
`;
