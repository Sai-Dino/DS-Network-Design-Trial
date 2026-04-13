import styled, { css } from "styled-components";

const breakpoint = {
  mobile: "480px",
};

const defaultStyles = css`
  border: 2px solid ${(props) => props.theme.murv.color.stroke.primary};
  background: ${(props) => props.theme.murv.color.surface.input.default};
`;

const hoverStyles = css`
  border: 2px solid ${(props) => props.theme.murv.color.icon.disabled};
  background: ${(props) => props.theme.murv.color.surface.input.hover};
`;

const focusStyles = css`
  border: 2px solid ${(props) => props.theme.murv.color.stroke.brand};
  background: ${(props) => props.theme.murv.color.surface.neutral.hover};
`;

const disabledStyles = css`
  color: ${(props) => props.theme.murv.color.icon.disabled};
  border: 2px solid ${(props) => props.theme.murv.color.stroke.disabled};
  background: ${(props) => props.theme.murv.color.surface.disabled.default};
  cursor: not-allowed;
`;

const activeStyles = css`
  border: 2px solid ${(props) => props.theme.murv.color.stroke.brandlight};
  background: ${(props) => props.theme.murv.color.surface.input.pressed};
`;

const noUserSelection = css`
  -moz-user-select: -moz-none;
  -moz-user-select: "none";
  -o-user-select: "none";
  -khtml-user-select: "none";
  -webkit-user-select: "none";
  -ms-user-select: "none";
  user-select: "none";
`;

export const SearchWrapper = styled.div<{ $showPrefixIcon?: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 420px;
  min-width: 248px;
  color: ${(props) => props.theme.murv.color.text};
  padding: ${(props) => props.theme.murv.spacing.s};
  cursor: text;
  border-radius: ${({ theme }) => theme.murv.radius.s};
  font-size: ${({ theme }) => theme.murv.typography.body.s.size};
  ${defaultStyles}

  svg {
    display: block;
  }

  /*disabled styles */
  &:has(input:disabled) {
    ${disabledStyles}
  }

  /* hover styles */
  &:hover:has(input:not(:disabled)) {
    ${hoverStyles}
  }

  /*focus styles */
  &:has(input:not(:disabled):focus) {
    ${focusStyles}
  }

  /* active styles */
  &:has(input:not(:disabled):active) {
    ${activeStyles}
    .search-icon.trigger.enabled {
      path {
        fill: ${(props) => props.theme.murv.color.icon.brand};
      }
    }
  }

  @media (max-width: ${breakpoint.mobile}) {
    .search-icon.trigger,
    .separator-icon {
      display: none;
    }
  }
  @media (min-width: ${breakpoint.mobile}) {
    .search-icon.icon {
      display: ${({ $showPrefixIcon }) => ($showPrefixIcon ? "block" : "none")};
    }
    .search-icon.trigger,
    .separator-icon {
      display: ${({ $showPrefixIcon }) => ($showPrefixIcon ? "none" : "block")};
    }
  }
`;

export const SearchContainer = styled.div`
  position: relative;
  flex: 1;
`;

export const SearchInputField = styled.input`
  color: inherit;
  border: none;
  outline: none;
  background: inherit;
  font-size: inherit;
  width: 100%;

  &::placeholder {
    color: ${(props) => props.theme.murv.color.icon.secondary};
  }
  &:disabled {
    ${noUserSelection}
    cursor: not-allowed;
    &::placeholder {
      color: ${(props) => props.theme.murv.color.icon.disabled};
    }
  }
`;

export const BeforeInput = styled.div`
  display: flex;
  margin-right: ${(props) => props.theme.murv.spacing.s};
`;

export const AfterInput = styled.div`
  display: flex;
  margin-left: ${(props) => props.theme.murv.spacing.s};
`;

export const IconWrapper = styled.div`
  &.trigger {
    padding: 0px ${(props) => props.theme.murv.spacing.s};
  }
  &.enabled {
    cursor: pointer;
  }
`;

export const SuffixContainer = styled.div`
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
`;
