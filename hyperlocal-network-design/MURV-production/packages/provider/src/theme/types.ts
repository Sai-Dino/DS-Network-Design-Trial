import { IThemeCore } from "./types/themeCore";
import { IThemeSystem, IThemeSystemTenant, IThemeVariations } from "./types/themeSystem";

export * from "./types/themeCore";
export * from "./types/themeSystem";

export type ITenantThemeGenerator = (args: {
  ThemeCore: IThemeCore;
  tenant?: IThemeSystemTenant;
  themeVariant?: IThemeVariations;
}) => IThemeSystem;
