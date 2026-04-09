import styled from "styled-components";
import { TYPES } from "./types";

export const SearchContainer = styled.div<{ width?: string; orientation?: string }>`
  display: flex;
  flex-direction: ${({ orientation }) => (orientation === TYPES.static ? "row" : "column")};
  width: ${({ width }) => width || "348px"};
  min-with: 348px;
  min-height: 41px; // min-height is required for supporting suggestions.
  > div {
    height: 40px;
  }
  .search-suggestion-container{
    height: 1px;
    position: relative;
    z-index: ${({ theme }) => theme.murv.zIndex.level99};
  }

  > div:first-child {
    border-top-left-radius: ${(props) => props.theme.murv?.radius.s};
    border-bottom-left-radius: ${(props) => props.theme.murv?.radius.s};
    button {
      border-top-right-radius: ${(props) => props.theme.murv?.radius.s};
      border-bottom-right-radius: ${(props) => props.theme.murv?.radius.s};
      background: none;
      &:focus:not(:disabled) {
        background: none;
        border-top-right-radius: ${(props) => props.theme.murv?.radius.s};
        border-bottom-right-radius: ${(props) => props.theme.murv?.radius.s};
      }
    }
  }
  > div:nth-child(2) {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    /* overriding the focus styles */
    &:hover:has(input:not(:disabled)),
    &:has(input:not(:disabled):focus) {
      border: ${(props) => props.theme.murv?.stroke.standard} solid
        ${(props) => props.theme.murv?.color.stroke.primary};
      background: ${(props) => props.theme.murv.color.surface.input.default};
    }
  };
`;

export const SelectContainer = styled.div`
  border: ${(props) => props.theme.murv?.stroke.standard} solid
    ${(props) => props.theme.murv?.color.stroke.primary};
  background: ${(props) => props.theme.murv?.color.surface.input.default};
  border-right: none;
  button {
    div[type="subtle"] {
      background: none;
    }
  }
`;

export const SearchSuggestionContainer = styled.div`

`;
