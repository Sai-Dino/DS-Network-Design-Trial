import React from "react";
import { TooltipRenderProps } from "react-joyride";

import {
  StyledContainer,
  StyledContainerFooter,
  StepContainer,
  StyledContainerHeader,
  StyledContainerContent,
  StyledButton,
  StyledButtonSkip,
  StyledButtonNext,
  JoyrideTitle,
  StyledNavigationContainer,
  Box,
} from "./styles";

export interface ITourGuidTooltip extends TooltipRenderProps, React.HTMLAttributes<HTMLDivElement> {
  showSkipButton?: boolean;
}

export const JoyrideTooltip = ({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  isLastStep,
  size,
  showSkipButton,
  skipProps,
  ...rest
}: ITourGuidTooltip): React.ReactElement => (
  <StyledContainer {...tooltipProps} {...rest}>
    <StyledContainerHeader>
      <Box>
        {step.title && typeof step.title === "string" ? (
          <JoyrideTitle>{step.title}</JoyrideTitle>
        ) : (
          step.title
        )}
      </Box>
      <StepContainer>
        {index + 1}/{size}
      </StepContainer>
    </StyledContainerHeader>
    <StyledContainerContent>{step.content}</StyledContainerContent>
    <StyledContainerFooter>
      {showSkipButton && (
        // @ts-ignore
        <StyledButtonSkip {...skipProps}>{skipProps.title || "Skip"}</StyledButtonSkip>
      )}
      <StyledNavigationContainer>
        {index > 0 && continuous && (
          // @ts-ignore
          <StyledButton {...backProps}>{backProps.title || "Back"}</StyledButton>
        )}
        {continuous && !isLastStep ? (
          // @ts-ignore
          <StyledButtonNext {...primaryProps}>{primaryProps.title || "Next"}</StyledButtonNext>
        ) : (
          // @ts-ignore
          <StyledButton {...closeProps}>{closeProps.title || "Close"}</StyledButton>
        )}
      </StyledNavigationContainer>
    </StyledContainerFooter>
  </StyledContainer>
);

export default JoyrideTooltip;
