import styled from "styled-components";
import {
  Status,
  Orientation,
  IStepperStylesProps,
  IProgressBarStylesProps,
  StepPlacement,
} from "./types";

export const StyledStep = styled.div<IStepperStylesProps>`
  min-width: 50px;
  width: fit-content;
  display: flex;
  gap: 12px;

  ${({ orientation, stepPlacement }) => {
    const isVertical = orientation === Orientation.vertical;
    const isBefore = stepPlacement === StepPlacement.before;

    return isVertical
      ? `
        ${
          isBefore
            ? "width: 100%; flex-direction: row-reverse;"
            : "min-height: 50px; flex-direction: row;"
        }
      `
      : `
      ${
        isBefore
          ? "height: 100%; flex-direction: column-reverse;"
          : "height: auto; flex-direction: column;"
      }
      `;
  }};
`;

export const StepBarContainer = styled.div<IStepperStylesProps>`
  position: relative;
  display: flex;
  align-items: center;
  ${({ orientation }) => {
    if (orientation && orientation === Orientation.vertical) {
      return `flex-direction: column`;
    }
    return `flex-direction: row`;
  }}
`;

export const StepCircle = styled.div<IStepperStylesProps>`
  width: 12px;
  height: 12px;
  border-radius: 100%;
  border: 2px solid
    ${({ status, theme, stepColor }) => {
      if (status === Status.completed || status === Status.inProgress) {
        if (stepColor) return stepColor;
        return theme.murv.color.stroke.brand;
      }
      return theme.murv.color.stroke.primary;
    }};
`;

export const StepBar = styled.div<IStepperStylesProps>`
  ${({ orientation }) => {
    if (orientation && orientation === Orientation.vertical) {
      return `
            width: 2px;
            min-height: 40px;
            max-height: 100%;
            height: calc(100% - 12px);`;
    }
    return `
        height: 2px;
        min-width: 40px;
        max-width: 100%;
        width: calc(100% - 12px);`;
  }}
  background-color: ${({ status, theme, stepColor }) => {
    if (status === Status.completed) {
      if (stepColor) return stepColor;
      return theme.murv.color.stroke.brand;
    }
    return theme.murv.color.stroke.primary;
  }};
`;

export const ProgressBar = styled.div<IProgressBarStylesProps & IStepperStylesProps>`
  ${({ theme, orientation, progressPercent }) => {
    if (orientation && orientation === Orientation.vertical) {
      return `
        width: 100%;
        height: ${progressPercent}%;
        border-radius:  0 0 ${theme.murv.spacing.s} ${theme.murv.spacing.s};
      `;
    }
    return `
        height: 100%;
        width: ${progressPercent}%;
        border-radius: 0 ${theme.murv.spacing.s} ${theme.murv.spacing.s} 0;
    `;
  }}
  background-color: ${({ theme, stepColor }) => {
    if (stepColor) return stepColor;
    return theme.murv.color.stroke.brand;
  }};
`;

export const StepLabelContainer = styled.div<IStepperStylesProps>`
  overflow-wrap: anywhere;
  ${({ orientation, stepPlacement }) => {
    if (orientation && orientation === Orientation.vertical) {
      return `
        padding-bottom: 8px;
        ${
          stepPlacement === StepPlacement.before
            ? `
              display: flex;
              flex-direction: column;
              align-items: end;`
            : ``
        }
      `;
    }
    return `
        padding-right: 8px;
    `;
  }}
`;

export const StepName = styled.div`
  font-size: ${({ theme }) => theme.murv.typography.body.s.size};
  font-weight: 400;
  line-height: ${({ theme }) => theme.murv.typography.body.s.lineHeight};
  color: ${({ theme }) => theme.murv.color.text.primary};
`;

export const StepSubText = styled.div`
  font-size: ${({ theme }) => theme.murv.typography.subtext.s.size};
  font-weight: 400;
  line-height: ${({ theme }) => theme.murv.typography.subtext.s.lineHeight};
  color: ${({ theme }) => theme.murv.color.text.secondary};
`;

export const StyledStepper = styled.div<IStepperStylesProps>`
  display: flex;
  flex-direction: ${({ orientation }) => (orientation === Orientation.vertical ? "column" : "row")};
  width: 100%;
`;

export const StepWrapper = styled.div<IStepperStylesProps>`
  flex-grow: 1;
  flex-basis: 0;
  > div:nth-child(1) {
    ${({ orientation }) => (orientation === Orientation.vertical ? "height: 100%" : "width: 100%")};
  }
`;
