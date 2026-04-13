import { SpaceUnit } from "../baseTypes";

/**
 * Stroke tokens. Resolved values: 0="0px", thin="1px", standard="2px", thick="3px"
 * @see ThemeReference.stroke - hover for actual resolved values
 */
export interface ISystemStroke extends Record<0 | "standard" | "thin" | "thick", SpaceUnit> {}
