export const getValidMaxValue = (max: number): number => {
  if (max < 0) {
    console.error("Max value must be greater than 0.");
    return 100;
  }
  return max;
};

export const getValidValue = (value: number, max: number): number => {
  if (value > max) {
    console.error("Value must be lesser than max value.");
    return max;
  }
  if (value < 0) {
    console.error("Value must be greater than 0.");
    return 0
  }
  return value;
};
