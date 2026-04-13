import React from "react";
import Tag from "@murv/tag";
import {
  StyledStep,
  StepBarContainer,
  StepCircle,
  StepBar,
  StepLabelContainer,
  StepName,
  StepSubText,
  ProgressBar,
} from "./styles";
import { IStepProps, Status, StepPlacement, StepPosition } from "./types";
import { getValidatedPercentage } from "./utils";

export const Step: React.FC<IStepProps> = ({
  data,
  orientation,
  position = "middle",
  testId,
  stepColor,
  stepPlacement = StepPlacement.after,
}) => (
  <StyledStep
    orientation={orientation}
    data-testid={testId}
    id={testId}
    stepPlacement={stepPlacement}
  >
    <StepBarContainer orientation={orientation}>
      <StepCircle status={data.status} stepColor={stepColor} data-testid={`${testId}-circle`} />
      {position !== StepPosition.end && (
        <StepBar
          status={data.status}
          orientation={orientation}
          data-testid={`${testId}-bar`}
          stepColor={stepColor}
        >
          {data.status === Status.inProgress && (
            <ProgressBar
              orientation={orientation}
              progressPercent={getValidatedPercentage(data?.progressPercent)}
              stepColor={stepColor}
              id="progress-bar"
            />
          )}
        </StepBar>
      )}
    </StepBarContainer>
    <StepLabelContainer orientation={orientation} stepPlacement={stepPlacement}>
      {data?.statusLabel && <Tag tagText={data.statusLabel} tagStyle={data.tagStyle} />}
      {data?.name && <StepName>{data.name}</StepName>}
      {data?.comments && <StepSubText>{data.comments}</StepSubText>}
      {data?.children && data.children}
    </StepLabelContainer>
  </StyledStep>
);

export default Step;
