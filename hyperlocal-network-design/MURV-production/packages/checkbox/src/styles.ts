import styled from "styled-components";
import { CheckboxPosition, CheckboxOrientation } from "./types";

export const InputCheckboxWrapper = styled.div`
  --back-shadow-color: transparent;
  display: inline-grid;
  border-radius: ${(props) => props.theme.murv.radius.xs};
  color: ${(props) => props.theme.murv.color.stroke.brand};
  background-color: var(--back-shadow-color);
  cursor: pointer;

  > * {
    grid-row: 1 / -1;
    grid-column: 1 / -1;
    margin: ${(props) => props.theme.murv.spacing.xxxs};
  }

  > svg {
    transition: 120ms scale ease-in-out;
  }

  > input {
    appearance: none;
    width: 100%;
    height: 100%;
    margin: 0;
    z-index: ${(props) => props.theme.murv.zIndex.level1};
    outline: none;
  }

  &:has(> input:focus-within) {
    outline: ${(props) => props.theme.murv.stroke.standard} solid
      ${(props) => props.theme.murv.color.stroke.brand};
  }

  &:has(> input:hover, > input:focus-within) {
    --back-shadow-color: ${(props) => props.theme.murv.color.surface.input.hover};
  }

  &:has(> input:active) {
    --back-shadow-color: ${(props) => props.theme.murv.color.surface.input.pressed};
  }

  &:has(> input:checked:hover, > input:checked:focus-within) {
    --back-shadow-color: ${(props) => props.theme.murv.color.surface.selected.hover};
  }

  &:has(> input:checked:active) {
    --back-shadow-color: ${(props) => props.theme.murv.color.surface.selected.pressed};
  }

  &:has(> input:disabled) {
    color: ${(props) => props.theme.murv.color.icon.disabled};
    pointer-events: none;
  }
`;

export const CheckboxWithLabelWrapper = styled.div`
  --input-checkbox-gap: ${(props) => props.theme.murv.spacing.l};
  display: flex;
  align-items: flex-start;
  &[data-disabled="true"] {
    pointer-events: none;
  }
  & > input {
    flex-shrink: 0;
  }
  & > label {
    cursor: pointer;
    padding-left: var(--input-checkbox-gap);
  }
  &[data-checkmark-position=${CheckboxPosition.right}] {
    flex-direction: row-reverse;
    justify-content: space-between;
    & > label {
      padding-left: 0;
      padding-right: var(--input-checkbox-gap);
    }
  }
`;

export const CheckboxGroupWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${(props) => props.theme.murv.spacing.xl};

  &[data-orientation=${CheckboxOrientation.vertical}] {
    flex-direction: column;
  }
`;
