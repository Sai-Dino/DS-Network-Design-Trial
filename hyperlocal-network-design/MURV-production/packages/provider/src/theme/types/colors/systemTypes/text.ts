import { Color, Intent } from "../../baseTypes";

export interface ISystemColorText extends Record<Exclude<Intent, "subtle" | "input" | "accent" | "brandlight" | "dangerlight" | "neutral">, Color> { }