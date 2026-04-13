import styled from "styled-components";
import { CheckMarkOrientation, CheckMarkPosition } from "./types";

export const CheckMarkWrapper = styled.div`
  --back-shadow-color: transparent;
  display: inline-grid;
  border-radius: ${(props) => props.theme.murv.radius.xs};
  place-items: center;
  color: ${(props) => props.theme.murv.color.stroke.brand};
  background-color: var(--back-shadow-color);
  > * {
    grid-row: 1 / -1;
    grid-column: 1 / -1;
    margin: ${(props) => props.theme.murv.spacing.xxxs};
  }
  > svg {
    scale: 0;
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
  &:has(> input:checked) {
    svg {
      scale: 1;
    }
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

export const CheckMarkOptionWrapper = styled.div`
  --input-checkmark-gap: ${(props) => props.theme.murv.spacing.l};
  display: flex;
  align-items: flex-start;
  flex-direction: row;
  padding: 8px 16px;
  cursor: pointer;

  &[data-disabled="true"] {
    pointer-events: none;
    cursor: default;
  }
  & > input {
    flex-shrink: 0;
  }
  & > label {
    cursor: pointer;
    flex: 1;
    padding-left: var(--input-checkmark-gap);
  }
  &[data-checkmark-position=${CheckMarkPosition.right}] {
    flex-direction: row-reverse;
    justify-content: space-between;
    & > label {
      padding-left: 0;
      padding-right: var(--input-checkmark-gap);
    }
  }
`;

export const CheckMarkGroupWrapper = styled.div`
  display: flex;
  flex-direction: row;
  &[data-orientation=${CheckMarkOrientation.vertical}] {
    flex-direction: column;
  }
`;

export const CheckMarkGroupSearchWrapper = styled.div`
  display: flex;
  flex-direction: column;
  > * {
    flex: 1;
  }
`;

export const SelectedValueOption = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.murv.color.stroke.primary};
  padding-bottom: ${(props) => props.theme.murv.spacing.s};
`;

export const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
`;

export const SearchWrapper = styled.div`
  display: flex;
  padding: 12px 16px;
  justify-content: flex-end;
  align-items: flex-start;
`;
