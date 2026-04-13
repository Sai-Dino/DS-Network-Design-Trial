import React, { createContext, useContext, useMemo } from "react";
import { ThemeProvider } from "styled-components";
import { IconProvider } from "@murv/icons";
import { getTenant, ThemeCore } from "./theme";
import { GlobalStyles } from "./globalStyles";
import {
  IThemeSystem,
  IThemeSystemTenant,
  IThemeVariations,
  IThemeSystemWithResolvedTokens,
} from "./theme/types/themeSystem";
import { ITenantThemeGenerator } from "./theme/types";
import { TENANT_ICON_CONFIG } from "./icons/config";

export type MURVProviderProps = {
  themeVariant: IThemeVariations;
  tenantThemeGenerator?: ITenantThemeGenerator;
  tenant?: IThemeSystemTenant;
  children: React.ReactNode;
};

const MurvContext = createContext<{
  tenant: IThemeSystemTenant;
  themeVariant: IThemeVariations;
  theme: IThemeSystem;
}>({
  tenant: "Flipkart",
  themeVariant: "light",
  theme: getTenant({ tenant: "Flipkart", ThemeCore, themeVariant: "light" }),
});

export function MURVProvider({
  tenant = "Flipkart",
  themeVariant = "light",
  tenantThemeGenerator = getTenant,
  children,
}: MURVProviderProps): JSX.Element {
  const tenantTheme = useMemo(
    () =>
      tenantThemeGenerator({
        ThemeCore,
        tenant,
        themeVariant,
      }),
    [tenant, themeVariant, tenantThemeGenerator],
  );

  const MurvContextValues = useMemo(
    () => ({ tenant, themeVariant, theme: tenantTheme }),
    [tenant, themeVariant, tenantTheme],
  );

  return (
    <MurvContext.Provider value={MurvContextValues}>
      <ThemeProvider theme={{ murv: tenantTheme as IThemeSystemWithResolvedTokens }}>
        <GlobalStyles />
        <IconProvider iconConfig={TENANT_ICON_CONFIG[tenant]}>{children}</IconProvider>
      </ThemeProvider>
    </MurvContext.Provider>
  );
}

export const useMURVContext = () => useContext(MurvContext);

export {
  ThemeReference,
  ThemeReferenceFlipkartLight,
  ThemeReferenceFlipkartDark,
  ThemeReferenceMakroLight,
} from "./theme";
