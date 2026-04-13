import { ICoreColors } from "./colors/coreTypes";
import { ICoreSpacing } from "./spacing/coreTypes";
import { ICoreStroke } from "./stroke/coreTypes";
import { ICoreRadius } from "./radius/coreTypes";
import { ICoreShadow } from "./shadow/coreTypes";
import { ICoreZIndex } from "./zIndex/coreTypes";
import { ICoreOpacity } from "./opacity/coreTypes";
import { ICoreAspectRatio } from "./aspectRatio/coreTypes";
import { ICoreTypography } from "./typography/coreTypes";

export interface IThemeCore {
  color: ICoreColors;
  spacing: ICoreSpacing;
  typography: ICoreTypography;
  stroke: ICoreStroke;
  radius: ICoreRadius;
  shadow: ICoreShadow;
  zIndex: ICoreZIndex;
  opacity: ICoreOpacity;
  aspectRatio: ICoreAspectRatio;
}
