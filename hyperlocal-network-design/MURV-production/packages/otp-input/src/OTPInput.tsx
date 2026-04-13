import React, { useEffect, useState } from "react";
import OTPINPUTCOMPONENT, { InputProps } from "react-otp-input";
import { Button } from "@murv/button";
import { OTPInputProps } from "./types";
import { formatTime } from "./utils";
import { DEFAULT_CONFIG } from "./constants";
import {
  OTPInputContainer,
  InputLabel,
  ErrorMsg,
  ResendOTP,
  StyledInput,
  ResendText,
  ContainerStyle,
} from "./styles";

export const OTPInput: React.FC<OTPInputProps> = ({
  id,
  dataTestId,
  value,
  onChange,
  onResend,
  numInputs = DEFAULT_CONFIG.numInputs,
  resendTimeout = DEFAULT_CONFIG.resendTimeout,
  isDisabled = DEFAULT_CONFIG.isDisabled,
  hasErrored = DEFAULT_CONFIG.hasErrored,
  errorMessage = DEFAULT_CONFIG.errorMessage,
  disableResendButton = DEFAULT_CONFIG.disableResendButton,
  startResendTimer = DEFAULT_CONFIG.startResendTimer,
}) => {
  const [resendCounter, setResendCounter] = useState(Math.max(0, resendTimeout));
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [resendRunning, setResendRunning] = useState(false);

  useEffect(() => {
    let intervalId: any;
    if (isTimerRunning) {
      intervalId = setInterval(() => {
        setResendCounter((prevTimer: number) => {
          if (prevTimer === 1) {
            setIsTimerRunning(false);
            clearInterval(intervalId);
          }
          return prevTimer - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isTimerRunning]);

  useEffect(() => {
    if (startResendTimer) {
      setIsTimerRunning(resendTimeout > 0);
      setResendCounter(Math.max(0, resendTimeout));
    } else {
      setIsTimerRunning(false);
      setResendCounter(0);
    }
  }, [startResendTimer, resendTimeout]);

  const handleResend = () => {
    setResendRunning(true);
    onResend();
    setResendRunning(false);
    if (resendTimeout > 0) {
      setResendCounter(resendTimeout);
      setIsTimerRunning(true);
    }
  };

  const renderInputWithProps = (inputProps: InputProps) => (
    <StyledInput
      data-testid={`otp-input-${dataTestId}`}
      {...inputProps}
      isDisabled={isDisabled}
      disabled={isDisabled}
      hasErrored={hasErrored}
    />
  );

  return (
    <OTPInputContainer id={id} data-testid={`otp-container-${dataTestId}`}>
      <InputLabel>Verification Code</InputLabel>
      <OTPINPUTCOMPONENT
        value={value}
        onChange={onChange}
        numInputs={numInputs}
        renderInput={renderInputWithProps}
        containerStyle={ContainerStyle}
      />
      {hasErrored && <ErrorMsg>{errorMessage}</ErrorMsg>}
      <ResendOTP>
        <ResendText isDisabled={isDisabled || disableResendButton}>
          {resendCounter
            ? `Resend Code in ${formatTime(resendCounter)}`
            : "Didn't receive the code ?"}
        </ResendText>
        <Button
          data-testid={`resend-${dataTestId}`}
          buttonStyle="brand"
          buttonType="inline"
          size="large"
          type="reset"
          onClick={handleResend}
          disabled={isDisabled || disableResendButton || resendCounter !== 0}
          isLoading={resendRunning}
        >
          Resend OTP
        </Button>
      </ResendOTP>
    </OTPInputContainer>
  );
};
