/**
 * Resolved theme token values for IDE hover and reference.
 * Use these when you need to see the actual values (e.g. "11px", "#eeeeee") that
 * theme.murv.* resolves to at runtime.
 *
 * - ThemeReference (default) = Flipkart light, used for DefaultTheme augmentation
 * - ThemeReferenceFlipkartLight, ThemeReferenceFlipkartDark, ThemeReferenceMakroLight
 *   for tenant-specific color values
 *
 * @example
 * ThemeReference.typography.subtext.s.size // "11px"
 * ThemeReference.color.surface.information.pressed // "#eeeeee" (Flipkart light)
 * ThemeReferenceMakroLight.color.surface.information.pressed // "#A7A5A5" (Makro light)
 */

/** Shared tokens - same across all tenants (from ThemeCore) */
const sharedTokens = {
  typography: {
    subtext: {
      s: {
        size: "11px",
        lineHeight: "16px",
        weight: 400,
        letterSpacing: "-.15px",
      },
    },
    body: {
      s: {
        size: "13px",
        lineHeight: "20px",
        weight: 500,
        letterSpacing: "0px",
      },
      sBold: {
        size: "13px",
        lineHeight: "20px",
        weight: 600,
        letterSpacing: "0px",
      },
    },
    heading: {
      s: {
        size: "15px",
        lineHeight: "24px",
        weight: 500,
        letterSpacing: ".15px",
      },
      m: {
        size: "17px",
        lineHeight: "24px",
        weight: 500,
        letterSpacing: ".15px",
      },
      l: {
        size: "19px",
        lineHeight: "28px",
        weight: 500,
        letterSpacing: ".15px",
      },
    },
  },
  spacing: {
    0: "0px",
    xxxs: "2px",
    xxs: "4px",
    xs: "6px",
    s: "8px",
    m: "10px",
    l: "12px",
    xl: "16px",
    xxl: "24px",
    xxxl: "32px",
  },
  radius: {
    0: "0px",
    xxs: "2px",
    xs: "4px",
    s: "8px",
    m: "12px",
    l: "16px",
    xl: "20px",
    xxl: "24px",
    xxxl: "32px",
  },
  stroke: {
    0: "0px",
    thin: "1px",
    standard: "2px",
    thick: "3px",
  },
  shadow: {
    overflow: "0px 2px 4px 0px #00000000",
    overlay: "0px 4px 8px 0px #00000000",
    floating: "0px 8px 16px 0px #00000000",
  },
  zIndex: {
    level0: 0,
    level1: 1,
    level2: 2,
    level3: 3,
    level99: 99,
  },
  aspectRatio: {
    square: "1/1",
    landscape: "4/3",
    portrait: "3/4",
    wide: "16/9",
  },
  opacity: {
    disabled: "30%",
    loading: "20%",
    blanket: "40%",
  },
} as const;

/** Flipkart light theme colors */
const colorsFlipkartLight = {
  surface: {
    neutral: { default: "#ffffff", hover: "#fafafa", pressed: "#f5f5f5" },
    brand: { default: "#2a55e5", hover: "#1c41d6", pressed: "#112ab8" },
    accent: { default: "#ffc200", hover: "#f9a825", pressed: "#ed9416" },
    information: { default: "#fafafa", hover: "#f5f5f5", pressed: "#eeeeee" },
    inverse: { default: "#212121", hover: "#424242", pressed: "#666666" },
    success: { default: "#e7f8ec", hover: "#b9ebc8", pressed: "#8adea3" },
    warning: { default: "#fef7e9", hover: "#feefd4", pressed: "#fddfa9" },
    danger: { default: "#fbebed", hover: "#f9cbce", pressed: "#f2a29e" },
    selected: { default: "#f0f5ff", hover: "#cee1ff", pressed: "#abc8ff" },
    disabled: { default: "#fafafa", hover: "#fafafa", pressed: "#fafafa" },
    input: { default: "#ffffff", hover: "#fafafa", pressed: "#f5f5f5" },
  },
  tag: {
    promotion: "#c70055",
    saving: "#ffeb3b",
    combo: "#00b2a9",
    category: "#eeeeee",
    recommended: "#212121",
  },
  text: {
    primary: "#212121",
    secondary: "#666666",
    brand: "#2a55e5",
    information: "#2a55e5",
    inverse: "#ffffff",
    success: "#108934",
    warning: "#fbb129",
    danger: "#df4535",
    selected: "#2a55e5",
    disabled: "#9e9e9e",
  },
  skeleton: {
    neutral: "#f5f5f5",
    subtle: "#fafafa",
  },
  icon: {
    primary: "#212121",
    secondary: "#666666",
    brand: "#2a55e5",
    information: "#2a55e5",
    inverse: "#ffffff",
    success: "#108934",
    warning: "#fbb129",
    danger: "#df4535",
    selected: "#2a55e5",
    disabled: "#e0e0e0",
  },
  stroke: {
    primary: "#eeeeee",
    secondary: "#f5f5f5",
    brand: "#2a55e5",
    brandlight: "#75a1ff",
    accent: "#ffc200",
    information: "#75a1ff",
    inverse: "#ffffff",
    success: "#8adea3",
    warning: "#fddfa9",
    danger: "#df4535",
    dangerlight: "#f2a29e",
    selected: "#2a55e5",
    disabled: "#e0e0e0",
  },
} as const;

/** Flipkart dark theme colors */
const colorsFlipkartDark = {
  surface: {
    neutral: { default: "#212121", hover: "#424242", pressed: "#666666" },
    brand: { default: "#5482ff", hover: "#75a1ff", pressed: "#abc8ff" },
    accent: { default: "#ed9416", hover: "#f9a825", pressed: "#ffc200" },
    information: { default: "#424242", hover: "#666666", pressed: "#808080" },
    inverse: { default: "#e0e0e0", hover: "#eeeeee", pressed: "#f5f5f5" },
    success: { default: "#08521e", hover: "#0b6024", pressed: "#0e772d" },
    warning: { default: "#af7b1c", hover: "#ce8807", pressed: "#e89910" },
    danger: { default: "#6D150E", hover: "#a7211c", pressed: "#b52a26" },
    selected: { default: "#061f80", hover: "#112ab8", pressed: "#1c41d6" },
    disabled: { default: "#424242", hover: "#424242", pressed: "#424242" },
    input: { default: "#000000", hover: "#212121", pressed: "#231E1E" },
  },
  tag: {
    promotion: "#770033",
    saving: "#f9a825",
    combo: "#007c76",
    category: "#424242",
    recommended: "#bdbdbd",
  },
  text: {
    primary: "#fafafa",
    secondary: "#f5f5f5",
    brand: "#abc8ff",
    information: "#abc8ff",
    inverse: "#000000",
    success: "#8adea3",
    warning: "#fddfa9",
    danger: "#f2a29e",
    selected: "#070752",
    disabled: "#9e9e9e",
  },
  skeleton: {
    neutral: "#424242",
    subtle: "#212121",
  },
  icon: {
    primary: "#fafafa",
    secondary: "#f5f5f5",
    brand: "#abc8ff",
    information: "#abc8ff",
    inverse: "#000000",
    success: "#8adea3",
    warning: "#fddfa9",
    danger: "#f2a29e",
    selected: "#070752",
    disabled: "#9e9e9e",
  },
  stroke: {
    primary: "#424242",
    secondary: "#424242",
    brand: "#abc8ff",
    brandlight: "#5482ff",
    accent: "#fff176",
    information: "#75a1ff",
    inverse: "#000000",
    success: "#0b6024",
    warning: "#ce8807",
    danger: "#f2a29e",
    dangerlight: "#a7211c",
    selected: "#112ab8",
    disabled: "#666666",
  },
} as const;

/** Makro light theme colors */
const colorsMakroLight = {
  surface: {
    neutral: { default: "#ffffff", hover: "#E9E9E9", pressed: "#D3D2D2" },
    brand: { default: "#231E1E", hover: "#212121", pressed: "#000000" },
    accent: { default: "#FFDD00", hover: "#fdd835", pressed: "#ffc200" },
    information: { default: "#E9E9E9", hover: "#D3D2D2", pressed: "#A7A5A5" },
    inverse: { default: "#231E1E", hover: "#4F4B4B", pressed: "#7B7878" },
    success: { default: "#CCE7D8", hover: "#99CFB1", pressed: "#4ec76a" },
    warning: { default: "#fef7e9", hover: "#feefd4", pressed: "#fddfa9" },
    danger: { default: "#F8D4D2", hover: "#F0A9A4", pressed: "#E97F77" },
    selected: { default: "#E9E9E9", hover: "#D3D2D2", pressed: "#A7A5A5" },
    disabled: { default: "#E9E9E9", hover: "#E9E9E9", pressed: "#E9E9E9" },
    input: { default: "#ffffff", hover: "#E9E9E9", pressed: "#D3D2D2" },
  },
  tag: {
    promotion: "#FF0050",
    saving: "#FFDD00",
    combo: "#C4D600",
    category: "#E6E1D2",
    recommended: "#231E1E",
  },
  text: {
    primary: "#231E1E",
    secondary: "#4F4B4B",
    brand: "#231E1E",
    information: "#009FDF",
    inverse: "#ffffff",
    success: "#00873C",
    warning: "#fbb129",
    danger: "#DA291C",
    selected: "#009FDF",
    disabled: "#9e9e9e",
  },
  skeleton: {
    neutral: "#D3D2D2",
    subtle: "#E9E9E9",
  },
  icon: {
    primary: "#231E1E",
    secondary: "#4F4B4B",
    brand: "#231E1E",
    information: "#009FDF",
    inverse: "#ffffff",
    success: "#00873C",
    warning: "#fbb129",
    danger: "#DA291C",
    selected: "#009FDF",
    disabled: "#9e9e9e",
  },
  stroke: {
    primary: "#D3D2D2",
    secondary: "#E9E9E9",
    brand: "#231E1E",
    brandlight: "#A7A5A5",
    accent: "#FFDD00",
    information: "#66C6ED",
    inverse: "#ffffff",
    success: "#99CFB1",
    warning: "#fddfa9",
    danger: "#DA291C",
    dangerlight: "#E97F77",
    selected: "#99D9F3",
    disabled: "#D3D2D2",
  },
} as const;

export const ThemeReferenceFlipkartLight = {
  ...sharedTokens,
  color: colorsFlipkartLight,
} as const;

export const ThemeReferenceFlipkartDark = {
  ...sharedTokens,
  color: colorsFlipkartDark,
} as const;

export const ThemeReferenceMakroLight = {
  ...sharedTokens,
  color: colorsMakroLight,
} as const;

/** Default for DefaultTheme augmentation - Flipkart light */
export const ThemeReference = ThemeReferenceFlipkartLight;
