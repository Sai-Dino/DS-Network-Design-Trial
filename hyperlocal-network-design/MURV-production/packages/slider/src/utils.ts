import { RefObject } from "react";

export const createSliderItemTestId = (sliderTestId: string | number, sliderValue: number) =>
  `${sliderTestId}-slider-${sliderValue}`;

export const getPosition = (
  currValue: number,
  min: number,
  max: number,
  handlerRef: RefObject<HTMLDivElement>,
) => {
  if (handlerRef.current && max > min) {
    const { left: Xmin, right: Xmax } = handlerRef.current.getBoundingClientRect();
    return ((Xmax - Xmin) / (max - min)) * (currValue - min);
  }
  return currValue;
};

export const getBoundaryValue = (val: number, minVal: number, maxVal: number) => {
  let currValue = val;
  currValue = currValue > maxVal ? maxVal : currValue;
  currValue = currValue < minVal ? minVal : currValue;
  return currValue;
};

export function getDecimalValue(num: number) {
  if (Math.abs(num) < 1) {
    const parts = num.toExponential().split("e-");
    const matissaDecimalPart = parts[0].split(".")[1];
    return (matissaDecimalPart ? matissaDecimalPart.length : 0) + parseInt(parts[1], 10);
  }
  const decimalPart = num.toString().split(".")[1];
  return decimalPart ? decimalPart.length : 0;
}

export function roundValueToStep(currValue: number, currStep: number) {
  const nearest = Math.round(currValue / currStep) * currStep;
  return Number(nearest.toFixed(getDecimalValue(currStep)));
}

export const getValue = (
  clientX: number,
  minVal: number,
  maxVal: number,
  handlerRef: RefObject<HTMLDivElement>,
) => {
  if (handlerRef.current) {
    const { left: Xmin, width: containerWidth } = handlerRef.current.getBoundingClientRect();
    let currValue;

    const diff = clientX - Xmin;
    const length = containerWidth;

    const percent = diff / length;

    currValue = (maxVal - minVal) * percent + minVal;

    currValue = getBoundaryValue(currValue, minVal, maxVal);

    return currValue;
  }
  return minVal;
};
