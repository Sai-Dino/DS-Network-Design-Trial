import { ICoreAspectRatio } from "./coreTypes";

/**
 * Aspect ratio tokens. Resolved: square="1/1", landscape="4/3", portrait="3/4", wide="16/9"
 * @see ThemeReference.aspectRatio - hover for actual resolved values
 */
export interface ISystemAsICoreAspectRatio
  extends Pick<ICoreAspectRatio, "square" | "landscape" | "portrait" | "wide"> {}
