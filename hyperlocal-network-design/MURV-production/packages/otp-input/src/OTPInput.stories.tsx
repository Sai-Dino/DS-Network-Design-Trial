import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { OTPInput } from "./OTPInput";

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction
const meta = {
  title: "Components/OTPInput",
  component: OTPInput as React.ComponentType,
  tags: ["autodocs"],
} as Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultOTPInput: Story = {
  render: () => {
    const [OTP, setOTP] = useState("");
    return (
      <OTPInput
        value={OTP}
        onChange={(val) => {
          setOTP(val);
        }}
        onResend={() => setOTP("")}
      />
    );
  },
};

export const DisabledOTPInput: Story = {
  render: () => {
    const [OTP, setOTP] = useState("");
    return (
      <OTPInput
        value={OTP}
        numInputs={6}
        onChange={(val) => {
          setOTP(val);
        }}
        isDisabled
        resendTimeout={0}
        onResend={() => setOTP("")}
      />
    );
  },
};

export const ErroredOTPInput: Story = {
  render: () => {
    const [OTP, setOTP] = useState("");
    return (
      <OTPInput
        value={OTP}
        numInputs={6}
        onChange={(val) => {
          setOTP(val);
        }}
        hasErrored
        errorMessage="Entered code is invalid"
        resendTimeout={60}
        onResend={() => setOTP("")}
      />
    );
  },
};

export const DisabledResendButtonOTPInput: Story = {
  render: () => {
    const [OTP, setOTP] = useState("");
    return (
      <OTPInput
        value={OTP}
        numInputs={6}
        onChange={(val) => {
          setOTP(val);
        }}
        disableResendButton
        resendTimeout={60}
        onResend={() => setOTP("")}
      />
    );
  },
};

export const OtpInputNoResendTimerOnLoad: Story = {
  render: () => {
    const [OTP, setOTP] = useState("");
    return (
      <OTPInput
        value={OTP}
        numInputs={6}
        onChange={(val) => {
          setOTP(val);
        }}
        startResendTimer={false}
        resendTimeout={60}
        onResend={() => setOTP("")}
      />
    );
  },
};
