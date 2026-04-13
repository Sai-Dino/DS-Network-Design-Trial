import { SizeUnit } from "../baseTypes";
import { ICoreTypographyDetailObject } from "./coreTypes";

type FontDetails = ICoreTypographyDetailObject;

export type ISystemTypography = {
  heading: {
    [Key in Extract<SizeUnit, "s" | "m" | "l">]: FontDetails;
  };
  body: {
    [Key in `${Extract<SizeUnit, "s">}Bold` | Extract<SizeUnit, "s">]: FontDetails;
  };
  /**
   * Subtext typography - small secondary text.
   * Resolved values: size="11px", lineHeight="16px", weight=400, letterSpacing="-.15px"
   * @see ThemeReference.typography.subtext.s for IDE hover with actual values
   */
  subtext: { [Key in Extract<SizeUnit, "s">]: FontDetails };
};
