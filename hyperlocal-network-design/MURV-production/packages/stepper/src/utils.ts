import { IProgressPercent } from "./types";

export const getValidatedPercentage = (value?: number): IProgressPercent => {
  if (typeof value !== "number") return 0;
  return Math.min(100, Math.max(0, value));
};
