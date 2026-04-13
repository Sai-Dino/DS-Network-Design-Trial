import { IThemeCore, IThemeSystem, IThemeVariations } from "../../types";
import { getMakroLightTheme } from "./light";

export const getMakroTheme = ({
  ThemeCore,
  themeVariant,
}: {
  themeVariant: IThemeVariations;
  ThemeCore: IThemeCore;
}): IThemeSystem => {
  switch (themeVariant) {
    case "dark":
    case "light":
    default:
      return getMakroLightTheme({ ThemeCore });
  }
};
