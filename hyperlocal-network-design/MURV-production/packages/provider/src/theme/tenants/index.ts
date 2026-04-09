import { ITenantThemeGenerator } from "../types";
import { getFlipkartTheme } from "./flipkart";
import { getMakroTheme } from "./makro";

export const getTenant: ITenantThemeGenerator = ({
  tenant = "Flipkart",
  ThemeCore,
  themeVariant = "light",
}) => {
  switch (tenant) {
    case "Makro":
      return getMakroTheme({ ThemeCore, themeVariant });
    case "Flipkart":
    default:
      return getFlipkartTheme({ ThemeCore, themeVariant });
  }
};
