import { ColorWithOpacity, PixelUnit, SpaceUnit } from "../baseTypes";

type ShadowOffsetX = SpaceUnit<0, Extract<PixelUnit, "px">>;

type ShadowOffsetY = SpaceUnit<2 | 4 | 8 | 12, Extract<PixelUnit, "px">>;

type ShadowBlur = SpaceUnit<4 | 8 | 16 | 24, Extract<PixelUnit, "px">>;

type ShadowSpread = SpaceUnit<0, Extract<PixelUnit, "px">>;

type ShadowColor = ColorWithOpacity;

export type ShadowObject =
  `${ShadowOffsetX} ${ShadowOffsetY} ${ShadowBlur} ${ShadowSpread} ${ShadowColor}`;

export interface ICoreShadow {
  10: ShadowObject;
  20: ShadowObject;
  30: ShadowObject;
  40: ShadowObject;
}
