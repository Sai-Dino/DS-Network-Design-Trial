import { ButtonGroupProps } from "packages/button-group/src/types";
import { ICONS } from "./constants";

export type IconNames = (typeof ICONS)[keyof typeof ICONS] | "";

interface IEmptyStateContainerIconProps {
  /**
   * Icon is passed to show the visual represenntation of empty state,
   */
  icon: IconNames;
}

interface IEmptyStateContainerImageProps {
  /**
   * Image is passed to show the visual represenntation of empty state,
   * Pass thee image in place of icon if the icon Illustration is not present
   */
  imageUrl: string;
  /**
   * Alternate name for image.
   */
  alt: string;
  /**
   * Height of image.
   */
  height?: number;
  /**
   * Width of image.
   */
  width?: number;
}

export type TEmptyStateContainerProps = {
  /**
   * Primary message for the Empty State.
   */
  primaryMessage?: string;
  /**
   * User Mesaage to convey the user what to do next after getting Empty State.
   */
  userMessage?: string;
  /**
   * Button group props where user can click to do the next action.
   */
  buttonGroupProps?: ButtonGroupProps;
} & (IEmptyStateContainerIconProps | IEmptyStateContainerImageProps);
