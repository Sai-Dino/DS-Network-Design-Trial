import { IThemeSystemTenant } from "packages/provider/src/theme/types/themeSystem";

type IIconStyles = "rounded" | "sharp";

export interface IIconConfigMetaType {
  type: IIconStyles;
  size: string;
  defaultClassName?: string;
}

export type IIconConfigType = {
  [key in IThemeSystemTenant]: IIconConfigMetaType;
};
