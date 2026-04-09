import { ShadowObject } from "./coreTypes";

type ShadowType = "overflow" | "floating" | "overlay";

/**
 * Shadow tokens. Resolved: overflow="0px 2px 4px 0px #00000000", overlay="0px 4px 8px 0px #00000000", floating="0px 8px 16px 0px #00000000"
 * @see ThemeReference.shadow - hover for actual resolved values
 */
export interface ISystemShadow extends Record<ShadowType, ShadowObject> {}
