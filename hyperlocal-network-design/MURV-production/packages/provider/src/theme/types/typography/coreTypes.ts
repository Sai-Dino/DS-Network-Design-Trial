import { SpaceUnit, SizeUnit, Weight } from "../baseTypes";

type CoreTypographyWeight = Extract<Weight, 400 | 500 | 600>;

type TypographyLetterSpacing = Extract<SizeUnit, "l" | "m" | "s">;

type TypographyLineHeight = Extract<SizeUnit, "l" | "m" | "s" | "xs">;

type TypographySize = Extract<SizeUnit, "l" | "m" | "s" | "xl" | "xxl">;

interface ICoreTypographySize extends Record<TypographySize, SpaceUnit> {}

interface ICoreTypographyWeight {
  regular: CoreTypographyWeight;
  medium: CoreTypographyWeight;
  bold: CoreTypographyWeight;
}

interface ICoreTypographyLetterSpacing extends Record<TypographyLetterSpacing, SpaceUnit> {}

interface ICoreTypographyLineHeight extends Record<TypographyLineHeight, SpaceUnit> {}

export interface ICoreTypography {
  weight: ICoreTypographyWeight;
  size: ICoreTypographySize;
  letterSpacing: ICoreTypographyLetterSpacing;
  lineHeight: ICoreTypographyLineHeight;
}

export type ICoreTypographyDetailObject = {
  weight: CoreTypographyWeight;
  /**
   * Font size token. For subtext.s: "11px". For body.s: "13px". For heading.s: "15px".
   * @see ThemeReference.typography - hover for actual resolved values
   */
  size: SpaceUnit;
  letterSpacing: SpaceUnit;
  lineHeight: SpaceUnit;
};
