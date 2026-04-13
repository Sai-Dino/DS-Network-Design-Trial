// import original module declarations
import "styled-components";
import { IThemeSystemWithResolvedTokens } from "@murv/provider/src/theme/types/themeSystem";

// and extend them! Uses IThemeSystemWithResolvedTokens so hover shows actual values (e.g. "12px" for radius.m)
declare module "styled-components" {
  export interface DefaultTheme {
    murv: IThemeSystemWithResolvedTokens;
  }
}
