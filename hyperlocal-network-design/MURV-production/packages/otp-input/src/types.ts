export interface OTPInputProps {
  /**
   * Id for BannerProps
   */
  id?: string;
  /**
   * Pass test id for unit tests
   */
  dataTestId?: string;
  /**
   * OTP value to be passed
   */
  value: string;
  /**
   * function to be called when OTP is changed
   */
  onChange: (otp: string) => void;
  /**
   * function to be called when Resend OTP is clicked
   */
  onResend: () => void;
  /**
   *  Number of OTP inputs to be rendered
   */
  numInputs?: number;
  /**
   * Resend Timeout after which Resend OTP button is enabled after each click
   */
  resendTimeout?: number;
  /**
   * Disables all the inputs and Resend Button
   */
  isDisabled?: boolean;
  /**
   * Indicates there is an error in the inputs.
   */
  hasErrored?: boolean;
  /**
   * Error message to display
   */
  errorMessage?: string;
  /**
   * When true, disable the resend text and button
   */
  disableResendButton?: boolean;
  /**
   * When false, prevents timer from starting
   */
  startResendTimer?: boolean;
}
