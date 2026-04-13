import { ButtonGroupProps } from "@murv/button-group";
import { TagProps } from "@murv/tag";
import { StatusType } from "./constants";

export interface BannerProps {
  /**
   * Id for BannerProps
   */
  id?: string;
  /**
   * Pass test id for unit tests
   */
  dataTestId?: string;
  /**
   * Status to Decide the state for Representation
   */
  status: keyof typeof StatusType;
  /**
   *  To show or hide the status tag
   */
  showStatusTag?: boolean;
  /**
   * If Status is defined and tag is not, default tag are loaded, if tag Prop is defined, then This will over ride the status based tag
   */
  tagProps?: TagProps;
  /**
   * If Status is defined and Prefix ICon is not, default Icons are loaded, if prefixIcon Prop is defined, then This will over ride the status based Icon
   */
  prefixIcon?: string;
  /**
   * Primary Text
   */
  primaryText?: string;
  /**
   * Secondary Text
   */
  secondaryText?: string;
  /**
   * Tertiary Text
   */
  tertiaryText?: string;
  /**
   * Button Group Component Props
   */
  buttonGroupProps?: ButtonGroupProps;
  /**
   * To show or hide the Closed Button
   */
  showCloseIcon?: boolean;
  /**
   * Function to be executed on close of the banner
   */
  onCloseButtonClick?: () => void;
}
