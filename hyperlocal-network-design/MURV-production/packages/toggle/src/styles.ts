import styled from "styled-components";
import { SwitchPosition } from "./types";

export const ToggleInput = styled.input`
  --highlight-size: 4px;
  --back-shadow-color: transparent;
  display: inline-flex;
  -webkit-appearance: none;
  appearance: none;
  width: 28px;
  height: 16px;
  color: ${(props) => props.theme.murv.color.icon.secondary};
  border: ${(props) => props.theme.murv.stroke.thin} solid currentColor;
  border-radius: 50px;
  position: relative;
  margin: 0;
  box-shadow: inset 0px 0px 0px 8px var(--back-shadow-color),
    0px 0px 0px var(--highlight-size) var(--back-shadow-color);
  &::before {
    --inner-space: 1px;
    position: absolute;
    content: "";
    left: var(--inner-space);
    margin-top: var(--inner-space);
    width: 12px;
    height: 12px;
    border-radius: 25px;
    transition-property: left, transform, background-color, width;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
    background-color: currentColor;
  }
  &:focus-within {
    --back-shadow-color: ${(props) => props.theme.murv.color.surface.input.hover};
    outline: ${(props) => props.theme.murv.stroke.standard} solid
      ${(props) => props.theme.murv.color.stroke.brand};
    outline-offset: var(--highlight-size);
  }
  &:hover {
    --back-shadow-color: ${(props) => props.theme.murv.color.surface.input.hover};
  }
  &:active {
    --back-shadow-color: ${(props) => props.theme.murv.color.surface.input.pressed};
    &::before {
      width: 16px;
    }
  }
  &:checked {
    color: ${(props) => props.theme.murv.color.icon.brand};
    &:hover,
    &:focus-within {
      --back-shadow-color: ${(props) => props.theme.murv.color.surface.selected.hover};
    }
    &:active {
      --back-shadow-color: ${(props) => props.theme.murv.color.surface.selected.pressed};
    }
    &::before {
      left: calc(100% - var(--inner-space));
      transform: translateX(-100%);
    }
  }
  &:disabled {
    color: ${(props) => props.theme.murv.color.icon.disabled};
    pointer-events: none;
  }
`;

export const ToggleOptionWrapper = styled.div`
  --input-toggle-gap: ${(props) => props.theme.murv.spacing.l};
  display: flex;
  align-items: flex-start;
  flex-direction: row;
  &[data-disabled="true"] {
    pointer-events: none;
  }
  & > input {
    flex-shrink: 0;
    margin-top: ${(props) => props.theme.murv.spacing.xxxs};
  }
  & > label {
    cursor: pointer;
    flex: 1;
    padding-left: var(--input-toggle-gap);
  }
  &[data-toggle-position=${SwitchPosition.right}] {
    flex-direction: row-reverse;
    justify-content: space-between;
    & > label {
      padding-left: 0;
      padding-right: var(--input-toggle-gap);
    }
  }
`;
