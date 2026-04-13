import styled, { css } from "styled-components";
import { Direction } from "./types";

export const DividerDiv = styled.div<{ direction: Direction }>`
  ${({ direction }) => {
    if (direction === "vertical") {
      return css`
        display: inline;
        align-self: normal;
        border-right: thin solid #000;
      `;
    }
    return css`
      width: 100%;
      display: block;
      border-bottom: thin solid #000;
    `;
  }}
`;
