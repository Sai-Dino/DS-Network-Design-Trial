import React from "react";
import { generateRandomId } from "@murv/core/utils/generate-random-id";
import { StyledStepper, StepWrapper } from "./styles";
import StepComponent from "./Step";
import { Orientation, StepPosition, IStepperProps, StepPlacement } from "./types";

export const Stepper: React.FC<IStepperProps> = ({
  data,
  orientation = Orientation.horizontal,
  testId,
  color,
  stepPlacement = StepPlacement.after,
}) => {
  const getPosition = (ind: number) => {
    if (ind === 0) return StepPosition.start;
    if (ind === data.length - 1) return StepPosition.end;
    return StepPosition.middle;
  };

  return (
    <StyledStepper orientation={orientation} data-testid={testId}>
      {Array.isArray(data) &&
        data?.length > 0 &&
        data?.map((stepData, ind) => {
          const uniqueID = generateRandomId();
          return (
            <StepWrapper key={`stepWrapper-${stepData.name}-${uniqueID}`} orientation={orientation}>
              <StepComponent
                data={stepData}
                orientation={orientation}
                position={getPosition(ind)}
                stepColor={color}
                testId={`${testId}-step-${ind}`}
                stepPlacement={stepPlacement}
              />
            </StepWrapper>
          );
        })}
    </StyledStepper>
  );
};
