import styled from "styled-components";
import { RadioPosition, RadioOrientation } from "./types";

export const InputRadio = styled.input`
  --back-shadow-color: transparent;
  --input-radio-size: ${(props) => props.theme.murv.spacing.xl};
  --highlight-size: ${(props) => props.theme.murv.stroke.thick};
  --input-fill-size: calc(var(--input-radio-size) / 2);
  appearance: none;
  cursor: pointer;
  color: ${(props) => props.theme.murv.color.icon.secondary};
  border: ${(props) => props.theme.murv.stroke.thin} solid currentColor;
  width: var(--input-radio-size);
  height: var(--input-radio-size);
  margin: 0;
  border-radius: 50%;
  display: inline-grid;
  place-content: center;
  box-shadow: inset 0px 0px 0px var(--input-fill-size) var(--back-shadow-color),
    0px 0px 0px var(--highlight-size) var(--back-shadow-color);
  &::before {
    content: "";
    width: var(--input-fill-size);
    height: var(--input-fill-size);
    border-radius: 50%;
    transform: scale(0);
    transition: 120ms transform ease-in-out;
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
  }
  &:checked {
    color: ${(props) => props.theme.murv.color.stroke.brand};
    &:hover,
    &:focus-within {
      --back-shadow-color: ${(props) => props.theme.murv.color.surface.selected.hover};
    }
    &:active {
      --back-shadow-color: ${(props) => props.theme.murv.color.surface.selected.pressed};
    }
    &::before {
      transform: scale(1);
    }
  }
  &:disabled {
    color: ${(props) => props.theme.murv.color.icon.disabled};
    pointer-events: none;
  }
`;

export const RadioOptionWrapper = styled.div`
  --input-radio-gap: ${(props) => props.theme.murv.spacing.l};
  display: flex;
  align-items: baseline;
  flex-direction: row;
  &[data-disabled="true"] {
    pointer-events: none;
  }
  & > input {
    flex-shrink: 0;
  }
  & > label {
    cursor: pointer;
    flex: 1;
    padding-left: var(--input-radio-gap);
  }
  &[data-radio-position=${RadioPosition.right}] {
    flex-direction: row-reverse;
    justify-content: space-between;
    & > label {
      padding-left: 0;
      padding-right: var(--input-radio-gap);
    }
  }
`;

export const RadioGroupWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${(props) => props.theme.murv.spacing.xl};
  &[data-orientation=${RadioOrientation.vertical}] {
    flex-direction: column;
  }
`;
