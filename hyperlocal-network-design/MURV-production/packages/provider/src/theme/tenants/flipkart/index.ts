import { IThemeCore, IThemeSystem, IThemeVariations } from "../../types";
import { getFlipkartLightTheme } from "./light";
import { getFlipkartDarkTheme } from "./dark";

export const getFlipkartTheme = ({
  ThemeCore,
  themeVariant,
}: {
  themeVariant: IThemeVariations;
  ThemeCore: IThemeCore;
}): IThemeSystem => {
  switch (themeVariant) {
    case "dark":
      return getFlipkartDarkTheme({ ThemeCore });
      break;
    case "light":
    default:
      return getFlipkartLightTheme({ ThemeCore });
  }
};
