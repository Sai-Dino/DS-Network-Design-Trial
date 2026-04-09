import { IThemeCore } from "../types";
import { ThemeCoreBase } from "./base";
import { ThemeCoreColors } from "./colors";

export const ThemeCore: IThemeCore = {
  ...ThemeCoreBase,
  color: ThemeCoreColors
};
