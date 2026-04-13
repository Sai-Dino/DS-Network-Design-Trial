import { ButtonGroupProps } from "@murv/button-group";
import { Slide, Zoom, Flip, Bounce, ToastTransitionProps } from "react-toastify";
import { StatusType, PositionType } from "./constants";

type TransitionType = "Slide" | "Zoom" | "Flip" | "Bounce";

export const TransitionComponents: Record<
  TransitionType,
  React.ComponentType<ToastTransitionProps>
> = {
  Slide,
  Zoom,
  Flip,
  Bounce,
};

export interface ToastProps {
  /**
   * Id for ToastProps
   */
  id?: string;
  /**
   * Pass test id for unit tests
   */
  dataTestId?: string;
  /**
   * If Status is defined and Prefix ICon is not, default Icons are loaded, if prefixIcon Prop is defined, then This will over ride the status based Icon
   */
  prefixIcon?: string;
  /**
   * message to bs shown
   */
  message?: string;
  /**
   * Button Group Component Props
   */
  buttonGroupProps?: ButtonGroupProps;
  /**
   * To show or hide the Closed Button
   */
  showCloseIcon?: boolean;
  /**
   *  Function to be called when toast is closed
   */
  onCloseCallback?: () => void;
  /**
   * autoclose timeout in milliseconds and if provided false then the timeout will be 20 seconds for that toast
   */
  autoClose?: false | number;
  /**
   * In case of multiple ToastComponent, ContainerID can be used to show toasts in specific ToastComponent
   */
  containerId?: string;
}
export interface CustomToastProps {
  /**
   * Id for ToastProps
   */
  id?: string;
  /**
   * Pass test id for unit tests
   */
  dataTestId?: string;
  /**
   * If Status is defined and Prefix ICon is not, default Icons are loaded, if prefixIcon Prop is defined, then This will over ride the status based Icon
   */
  prefixIcon?: string;
  /**
   * message to be shown
   */
  message?: string;
  /**
   * Status to Decide the state for Representation
   */
  status: keyof typeof StatusType;
  /**
   * Button Group Component Props
   */
  buttonGroupProps?: ButtonGroupProps;
  /**
   * To show or hide the Closed Button
   */
  showCloseIcon?: boolean;
  /**
   * Default function passed by react-toastify library, this is not required to be passed from outside
   */
  closeToast?: () => void;
}

export interface ToastComponentProps {
  /**
   * Position of the toast
   */
  position?: PositionType;
  /**
   * default auto close timeout to be set for toast in that ToastBaseContainer
   */
  autoClose?: number | false;
  /**
   * whether to show new toasts on top or not
   */
  newestOnTop?: boolean;
  /**
   * In case of multiple ToastBaseContainer, ContainerID can be used to show toasts in specific ToastBaseContainer
   */
  containerId?: string;
  /**
   * Transition for the toasts
   */
  transition?: TransitionType;
}
