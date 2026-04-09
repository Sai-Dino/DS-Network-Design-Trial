import { SizeUnit, SpaceUnit } from "../baseTypes";

type RadiusUnit = Extract<SizeUnit, 0 | "xxs" | "xs" | "s" | "m" | "l" | "xl" | "xxl" | "xxxl">;

type RadiusScale = Record<RadiusUnit, SpaceUnit>;

export interface ICoreRadius extends RadiusScale { }
