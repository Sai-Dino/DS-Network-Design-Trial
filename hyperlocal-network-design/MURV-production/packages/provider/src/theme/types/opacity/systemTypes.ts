import { Percent } from "../baseTypes";

type OpacityState = "disabled" | "loading" | "blanket";

/**
 * Opacity tokens. Resolved values: disabled="30%", loading="20%", blanket="40%"
 * @see ThemeReference.opacity - hover for actual resolved values
 */
export interface ISystemOpacity extends Record<OpacityState, Percent> {}
