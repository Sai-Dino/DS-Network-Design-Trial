import styled, { css } from "styled-components";

export const FilterBarContainer = styled.div`
  display: inline-flex;
  align-items: stretch;
  /* border-radius: ${(props) => `${`${props.theme.murv.radius.s}`}`};
  border: ${(props) => ` 2px solid ${props.theme.murv.color.stroke.primary}`}; */
`;

export const DummyIcon = styled.div`
  display: inline-flex;
  align-items: center;
  height: 100%;
  padding: 0 12px;
  /* border-right: ${(props) => ` 2px solid ${props.theme.murv.color.stroke.primary}`}; */
`;

export const InlineContainer = styled.div`
  display: flex;
  align-items: center;
`;

export const DropdownContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

export const Item = styled.div<{ inline?: boolean; first?: boolean; last?: boolean }>`
  ${(props) =>
    props.inline
      ? css`
          display: inline-flex;
          align-items: center;
          ${() =>
            props.first &&
            css`
              border: ${() => `2px solid ${props.theme.murv.color.stroke.primary}`};
              border-top-left-radius: ${() => `${props.theme.murv.radius.s}`};
              border-bottom-left-radius: ${() => `${props.theme.murv.radius.s}`};
            `}

          ${() =>
            props.last &&
            css`
              border-left: none;
              border-top: ${() => `2px solid ${props.theme.murv.color.stroke.primary}`};
              border-right: ${() => `2px solid ${props.theme.murv.color.stroke.primary}`};
              border-bottom: ${() => `2px solid ${props.theme.murv.color.stroke.primary}`};
              border-top-right-radius: ${() => `${props.theme.murv.radius.s}`};
              border-bottom-right-radius: ${() => `${props.theme.murv.radius.s}`};
            `}

      ${() =>
            !props.first &&
            !props.last &&
            css`
              border-top: ${() => `2px solid ${props.theme.murv.color.stroke.primary}`};
              border-right: ${() => `2px solid ${props.theme.murv.color.stroke.primary}`};
              border-bottom: ${() => `2px solid ${props.theme.murv.color.stroke.primary}`};
            `}
        `
      : css`
          width: 100%;
        `}
`;

export const MoreFiltersDropdown = styled.div`
  position: relative;
  display: inline-block;
`;

export const DropdownContent = styled.div`
  position: absolute;
  z-index: 1;
  width: 100%; /* Ensure the dropdown takes full width */
`;
