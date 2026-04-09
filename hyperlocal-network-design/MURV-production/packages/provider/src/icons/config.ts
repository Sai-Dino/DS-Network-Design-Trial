import { IIconConfigType } from "./types";

export const TENANTS = {
  FLIPKART: "Flipkart",
  MAKRO: "Makro",
} as const;

export const TENANT_ICON_CONFIG: IIconConfigType = {
  [TENANTS.FLIPKART]: { type: "rounded", size: "20px", defaultClassName: "fk-icon" },
  [TENANTS.MAKRO]: { type: "sharp", size: "20px", defaultClassName: "makro-icon" },
};
