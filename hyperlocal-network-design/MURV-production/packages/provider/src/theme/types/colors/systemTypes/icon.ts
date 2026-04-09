import { Color, Intent } from "../../baseTypes";

export interface ISystemColorIcon extends Record<Exclude<Intent, "subtle" | "input" | "accent" | "brandlight" | "dangerlight" | "neutral">, Color> { }
