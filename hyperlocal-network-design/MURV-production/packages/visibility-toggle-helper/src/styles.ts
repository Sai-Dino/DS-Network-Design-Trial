import styled, { css } from "styled-components";
import { supportsPopover } from "./utils";

export const Content = styled.div`
  ${() => {
    if (supportsPopover()) {
      return css`
        &:popover-open {
          position: absolute;
          border: unset; // Popover api sets a border around popover
        }
      `;
    }
    return css`
      position: absolute;
      z-index: ${({ theme }) => theme.murv.zIndex.level99};
    `;
  }}
`;
