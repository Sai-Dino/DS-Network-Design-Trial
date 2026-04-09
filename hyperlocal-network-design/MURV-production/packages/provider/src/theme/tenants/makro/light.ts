import { IThemeCore, IThemeSystem } from "../../types";

export const getMakroLightTheme = ({ ThemeCore }: { ThemeCore: IThemeCore }): IThemeSystem => ({
  color: {
    surface: {
      neutral: {
        default: ThemeCore.color.grey[0],
        hover: ThemeCore.color.grey[75],
        pressed: ThemeCore.color.grey[350],
      },
      brand: {
        default: ThemeCore.color.grey[850],
        hover: ThemeCore.color.grey[900],
        pressed: ThemeCore.color.grey[1000],
      },
      accent: {
        default: ThemeCore.color.yellow[550],
        hover: ThemeCore.color.yellow[600],
        pressed: ThemeCore.color.yellow[700],
      },
      information: {
        default: ThemeCore.color.grey[75],
        hover: ThemeCore.color.grey[350],
        pressed: ThemeCore.color.grey[450],
      },
      inverse: {
        default: ThemeCore.color.grey[850],
        hover: ThemeCore.color.grey[750],
        pressed: ThemeCore.color.grey[550],
      },
      success: {
        default: ThemeCore.color.green[75],
        hover: ThemeCore.color.green[250],
        pressed: ThemeCore.color.green[300],
      },
      warning: {
        default: ThemeCore.color.mustard[50],
        hover: ThemeCore.color.mustard[100],
        pressed: ThemeCore.color.mustard[200],
      },
      danger: {
        default: ThemeCore.color.red[75],
        hover: ThemeCore.color.red[150],
        pressed: ThemeCore.color.red[250],
      },
      selected: {
        default: ThemeCore.color.grey[75],
        hover: ThemeCore.color.grey[350],
        pressed: ThemeCore.color.grey[450],
      },
      disabled: {
        default: ThemeCore.color.grey[75],
        hover: ThemeCore.color.grey[75],
        pressed: ThemeCore.color.grey[75],
      },
      input: {
        default: ThemeCore.color.grey[0],
        hover: ThemeCore.color.grey[75],
        pressed: ThemeCore.color.grey[350],
      },
    },
    tag: {
      promotion: ThemeCore.color.pink[500],
      saving: ThemeCore.color.yellow[550],
      combo: ThemeCore.color.yellowgreen[500],
      category: ThemeCore.color.warmgrey[500],
      recommended: ThemeCore.color.grey[850],
    },
    text: {
      primary: ThemeCore.color.grey[850],
      secondary: ThemeCore.color.grey[750],
      brand: ThemeCore.color.grey[850],
      information: ThemeCore.color.vividblue[550],
      inverse: ThemeCore.color.grey[0],
      success: ThemeCore.color.green[550],
      warning: ThemeCore.color.mustard[500],
      danger: ThemeCore.color.red[550],
      selected: ThemeCore.color.vividblue[550],
      disabled: ThemeCore.color.grey[500], // change
    },
    skeleton: {
      neutral: ThemeCore.color.grey[350],
      subtle: ThemeCore.color.grey[75],
    },
    icon: {
      primary: ThemeCore.color.grey[850],
      secondary: ThemeCore.color.grey[750],
      brand: ThemeCore.color.grey[850],
      information: ThemeCore.color.vividblue[550],
      inverse: ThemeCore.color.grey[0],
      success: ThemeCore.color.green[550],
      warning: ThemeCore.color.mustard[500],
      danger: ThemeCore.color.red[550],
      selected: ThemeCore.color.vividblue[550],
      disabled: ThemeCore.color.grey[500], // change
    },
    stroke: {
      primary: ThemeCore.color.grey[350],
      secondary: ThemeCore.color.grey[75],
      brand: ThemeCore.color.grey[850],
      brandlight: ThemeCore.color.grey[450],
      accent: ThemeCore.color.yellow[550],
      information: ThemeCore.color.vividblue[250],
      inverse: ThemeCore.color.grey[0],
      success: ThemeCore.color.green[250],
      warning: ThemeCore.color.mustard[200],
      danger: ThemeCore.color.red[550],
      dangerlight: ThemeCore.color.red[250],
      selected: ThemeCore.color.vividblue[150], // change
      disabled: ThemeCore.color.grey[350],
    },
  },
  spacing: {
    0: ThemeCore.spacing[0],
    xxxs: ThemeCore.spacing[1],
    xxs: ThemeCore.spacing[2],
    xs: ThemeCore.spacing[3],
    s: ThemeCore.spacing[4],
    m: ThemeCore.spacing[5],
    l: ThemeCore.spacing[6],
    xl: ThemeCore.spacing[7],
    xxl: ThemeCore.spacing[9],
    xxxl: ThemeCore.spacing[11],
  },
  radius: {
    0: ThemeCore.radius[0],
    xxs: ThemeCore.radius.xxs,
    xs: ThemeCore.radius.xs,
    s: ThemeCore.radius.s,
    m: ThemeCore.radius.m,
    l: ThemeCore.radius.l,
    xl: ThemeCore.radius.xl,
    xxl: ThemeCore.radius.xxl,
    xxxl: ThemeCore.radius.xxxl,
  },
  stroke: {
    0: ThemeCore.stroke.solid[0],
    standard: ThemeCore.stroke.solid[2],
    thin: ThemeCore.stroke.solid[1],
    thick: ThemeCore.stroke.solid[3],
  },
  shadow: {
    overflow: ThemeCore.shadow[10],
    overlay: ThemeCore.shadow[20],
    floating: ThemeCore.shadow[30],
  },
  zIndex: {
    level0: ThemeCore.zIndex.level0,
    level1: ThemeCore.zIndex.level1,
    level2: ThemeCore.zIndex.level2,
    level3: ThemeCore.zIndex.level3,
    level99: ThemeCore.zIndex.level99,
  },
  aspectRatio: {
    square: ThemeCore.aspectRatio.square,
    landscape: ThemeCore.aspectRatio.landscape,
    portrait: ThemeCore.aspectRatio.portrait,
    wide: ThemeCore.aspectRatio.wide,
  },
  opacity: {
    disabled: ThemeCore.opacity[300],
    loading: ThemeCore.opacity[200],
    blanket: ThemeCore.opacity[400],
  },
  typography: {
    heading: {
      s: {
        weight: ThemeCore.typography.weight.medium,
        size: ThemeCore.typography.size.l,
        letterSpacing: ThemeCore.typography.letterSpacing.l,
        lineHeight: ThemeCore.typography.lineHeight.m,
      },
      m: {
        weight: ThemeCore.typography.weight.medium,
        size: ThemeCore.typography.size.xl,
        letterSpacing: ThemeCore.typography.letterSpacing.l,
        lineHeight: ThemeCore.typography.lineHeight.m,
      },
      l: {
        weight: ThemeCore.typography.weight.medium,
        size: ThemeCore.typography.size.xxl,
        letterSpacing: ThemeCore.typography.letterSpacing.l,
        lineHeight: ThemeCore.typography.lineHeight.l,
      },
    },
    body: {
      s: {
        weight: ThemeCore.typography.weight.medium,
        size: ThemeCore.typography.size.m,
        letterSpacing: ThemeCore.typography.letterSpacing.m,
        lineHeight: ThemeCore.typography.lineHeight.s,
      },
      sBold: {
        weight: ThemeCore.typography.weight.bold,
        size: ThemeCore.typography.size.m,
        letterSpacing: ThemeCore.typography.letterSpacing.m,
        lineHeight: ThemeCore.typography.lineHeight.s,
      },
    },
    subtext: {
      s: {
        weight: ThemeCore.typography.weight.regular,
        size: ThemeCore.typography.size.s,
        letterSpacing: ThemeCore.typography.letterSpacing.s,
        lineHeight: ThemeCore.typography.lineHeight.xs,
      },
    },
  },
});
