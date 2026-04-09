import { SizeUnit, SpaceUnit } from "../baseTypes";

type ScaleUnit = Extract<
  SizeUnit,
  0 | "xxxs" | "xxs" | "xs" | "s" | "m" | "l" | "xl" | "xxl" | "xxxl"
>;

/**
 * Spacing tokens. Resolved values: 0="0px", xxxs="2px", xxs="4px", xs="6px", s="8px", m="10px", l="12px", xl="16px", xxl="24px", xxxl="32px"
 * @see ThemeReference.spacing - hover for actual resolved values
 */
export interface ISystemSpacing extends Record<ScaleUnit, SpaceUnit> {}
