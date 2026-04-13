import { Color, Intent } from "../../baseTypes";

export interface ISystemColorSkeleton
  extends Record<Extract<Intent, "neutral" | "subtle">, Color> {}
