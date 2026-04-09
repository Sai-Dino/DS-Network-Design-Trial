import React from "react";
import Loader from "@murv/loader";
import { useMURVContext } from "@murv/provider";
import { useId } from "@murv/core/hooks/use-id";
import {
  Container,
  Progress,
  Label,
  ValueText,
  Background,
  BarContainer,
  MainDispalyContainer,
  LeftDisplayContainer,
  ProgressElement,
} from "./styles";
import { TProgressBar } from "./types";
import { PROGRESS_BAR_VARIANTS } from "./constants";
import { getValidMaxValue, getValidValue } from "./utils";

export function ProgressBar({
  variant,
  label = "Progress so far...",
  value = 0,
  max: maxProp = 100,
  dataTestId = "progress-bar-systematic",
}: TProgressBar) {
  const { theme } = useMURVContext();
  const ProgressElementId = useId();

  const max = getValidMaxValue(variant === PROGRESS_BAR_VARIANTS.SYSTEMATIC ? 100 : maxProp);
  const validValue = getValidValue(value, max);
  const progressVal = (validValue / max) * 100;

  return (
    <Container data-testid={dataTestId} data-variant={variant}>
      <MainDispalyContainer data-variant={variant}>
        <Label htmlFor={ProgressElementId}>{label}</Label>
        <LeftDisplayContainer aria-hidden="true">
          <ValueText>
            {variant === PROGRESS_BAR_VARIANTS.SYSTEMATIC
              ? `${validValue}%`
              : `${validValue}/${max}`}
          </ValueText>
          {validValue !== max && variant === PROGRESS_BAR_VARIANTS.SYSTEMATIC && (
            <Loader customColor={theme.color.text.success} />
          )}
        </LeftDisplayContainer>
      </MainDispalyContainer>
      <BarContainer aria-hidden="true" data-variant={variant}>
        <Background data-variant={variant} />
        <Progress data-testid="test-progress-bar-value" percent={progressVal} />
      </BarContainer>
      <ProgressElement id={ProgressElementId} value={progressVal} max={max}>
        {progressVal}%
      </ProgressElement>
    </Container>
  );
}
