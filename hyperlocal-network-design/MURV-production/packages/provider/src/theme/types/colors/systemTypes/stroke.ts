import { Color, Intent } from "../../baseTypes";

export interface ISystemColorStroke extends Record<Exclude<Intent, "input" | "neutral" | "subtle">, Color> { }
