import React from "react";
import { render, fireEvent } from "test-utils";
import { waitFor } from "@testing-library/react";
import { OTPInput, OTPInputProps } from "../src";

// Mock the onResend function
const mockOnResend = jest.fn();

const renderOTPInput = (props: OTPInputProps) => render(<OTPInput {...props} />);

describe("OTPInput Component", () => {
  const testId = "test";
  it("renders with the correct number of input fields", () => {
    const { getAllByTestId } = renderOTPInput({
      dataTestId: testId,
      value: "",
      onChange: jest.fn(),
      onResend: mockOnResend,
    });
    const inputFields = getAllByTestId(`otp-input-${testId}`);
    expect(inputFields).toHaveLength(6); // Assuming default numInputs is 6
  });

  it("calls onChange callback when input values change", async () => {
    const onChange = jest.fn();
    const { getAllByTestId } = renderOTPInput({
      dataTestId: testId,
      value: "",
      onChange,
      onResend: mockOnResend,
    });

    const inputFields = getAllByTestId(`otp-input-${testId}`);
    inputFields.forEach((input, index) => {
      fireEvent.change(input, { target: { value: (index + 1).toString() } });
    });

    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(6));
  });

  it("displays error message when hasErrored is true", () => {
    const errorMessage = "Invalid code";
    const { getByText } = renderOTPInput({
      value: "",
      onChange: jest.fn(),
      onResend: mockOnResend,
      hasErrored: true,
      errorMessage,
    });

    expect(getByText(errorMessage)).toBeInTheDocument();
  });

  it("displays correct text for resend button", async () => {
    const { getByText } = renderOTPInput({
      value: "",
      onChange: jest.fn(),
      onResend: mockOnResend,
    });

    expect(getByText("Resend Code in 02:00")).toBeInTheDocument(); // Assuming default resendTimeout is 120 seconds
  });

  it("calls onResend callback when resend button is clicked after the timeout", async () => {
    jest.useFakeTimers(); // Mock timers

    const { getByTestId } = renderOTPInput({
      dataTestId: testId,
      value: "",
      onChange: jest.fn(),
      onResend: mockOnResend,
    });
    const resendButton = getByTestId(`resend-${testId}`);

    // Advance timer to just before timeout
    jest.advanceTimersByTime(119000); // Assuming default resendTimeout is 120000 ms

    // Resend button should still be disabled
    expect(resendButton).toBeDisabled();

    // Advance timer to timeout
    jest.advanceTimersByTime(1000);

    // Resend button should be enabled now
    expect(resendButton).not.toBeDisabled();

    // Click resend button
    fireEvent.click(resendButton);

    // Ensure onResend callback is called
    await waitFor(() => expect(mockOnResend).toHaveBeenCalledTimes(1));
  });

  it("does not call onResend callback when resend button is clicked during resend timeout", async () => {
    const mockOnResend2 = jest.fn();
    const { getByTestId } = renderOTPInput({
      dataTestId: "testId2",
      value: "",
      onChange: jest.fn(),
      onResend: mockOnResend2,
    });
    const resendButton = getByTestId(`resend-testId2`);
    fireEvent.click(resendButton);
    await waitFor(() => expect(mockOnResend2).not.toHaveBeenCalled());
  });
});
