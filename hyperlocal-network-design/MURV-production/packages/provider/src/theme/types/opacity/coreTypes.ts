import { Percent, Weight } from "../baseTypes";

type OpacityWeight = Extract<Weight, 100 | 200 | 300 | 400 | 500>;

export interface ICoreOpacity extends Record<OpacityWeight, Percent> {}
