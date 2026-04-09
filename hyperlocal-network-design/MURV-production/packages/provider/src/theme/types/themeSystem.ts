import { ISystemAsICoreAspectRatio } from "./aspectRatio/systemTypes";
import {
  ISystemColorIcon,
  ISystemColorSkeleton,
  ISystemColorStroke,
  ISystemColorSurface,
  ISystemColorText,
  ISystemColorTag,
} from "./colors/systemTypes";
import { ISystemOpacity } from "./opacity/systemTypes";
import { ISystemRadius } from "./radius/systemTypes";
import { ISystemShadow } from "./shadow/systemTypes";
import { ISystemSpacing } from "./spacing/systemTypes";
import { ISystemStroke } from "./stroke/systemTypes";
import { ISystemTypography } from "./typography/systemTypes";
import { ISystemZIndex } from "./zIndex/systemTypes";
import { ThemeReference } from "../themeReference";

export interface IThemeSystem {
  color: {
    surface: ISystemColorSurface;
    text: ISystemColorText;
    skeleton: ISystemColorSkeleton;
    icon: ISystemColorIcon;
    stroke: ISystemColorStroke;
    tag: ISystemColorTag;
  };
  spacing: ISystemSpacing;
  radius: ISystemRadius;
  stroke: ISystemStroke;
  shadow: ISystemShadow;
  zIndex: ISystemZIndex;
  aspectRatio: ISystemAsICoreAspectRatio;
  opacity: ISystemOpacity;
  typography: ISystemTypography;
}

/**
 * Theme system with literal token types for IDE hover - shows actual values (e.g. "12px", "#eeeeee") instead of generic types.
 * Used for DefaultTheme augmentation in styled-components.
 * Colors reflect Flipkart light theme; other tenants may have different values at runtime.
 */
export type IThemeSystemWithResolvedTokens = Omit<
  IThemeSystem,
  | "color"
  | "spacing"
  | "radius"
  | "stroke"
  | "shadow"
  | "zIndex"
  | "aspectRatio"
  | "opacity"
  | "typography"
> & {
  color: typeof ThemeReference.color;
  spacing: typeof ThemeReference.spacing;
  radius: typeof ThemeReference.radius;
  stroke: typeof ThemeReference.stroke;
  shadow: typeof ThemeReference.shadow;
  zIndex: typeof ThemeReference.zIndex;
  aspectRatio: typeof ThemeReference.aspectRatio;
  opacity: typeof ThemeReference.opacity;
  typography: typeof ThemeReference.typography;
};

export type IThemeSystemTenant = "Flipkart" | "Makro";

export type IThemeVariations = "light" | "dark";
