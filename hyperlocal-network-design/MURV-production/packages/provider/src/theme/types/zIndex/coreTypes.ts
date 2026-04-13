import { ScaleUnit } from "../baseTypes";

type ZIndexUnit = Extract<ScaleUnit, 0 | 1 | 2 | 3> | 99;

type ZIndexLevel = `level${ZIndexUnit}`;

export type ICoreZIndex = Record<ZIndexLevel, ZIndexUnit>;
