import { ScaleUnit, SpaceUnit } from "../baseTypes";

type StrokeVariant = "solid" | "dotted" | "dashed";

type StrokeUnit = Extract<ScaleUnit, 0 | 1 | 2 | 3>;

type StrokeScale = Record<StrokeUnit, SpaceUnit>;

export interface ICoreStroke extends Record<StrokeVariant, StrokeScale> {}
