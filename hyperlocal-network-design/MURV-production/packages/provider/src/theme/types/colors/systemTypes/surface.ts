import { Color, State, Intent } from "../../baseTypes";

export interface ISystemColorSurface
  extends Record<Exclude<Intent, "subtle" | "primary" | "secondary" | "brandlight" | "dangerlight">, { [Key in State]: Color }> { }
