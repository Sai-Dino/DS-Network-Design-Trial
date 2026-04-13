import React from "react";
import "@testing-library/jest-dom";
import { render } from "test-utils";
import { ProgressBar, PROGRESS_BAR_VARIANTS } from "../src/index";

describe("Progress bar", () => {
  it("renders the Progress bar", () => {
    const defaultProps = {
      variant: PROGRESS_BAR_VARIANTS.SYSTEMATIC,
      value: 20,
      label: "Downloading...",
      dataTestId: "progress-bar-systematic",
    };
    render(<ProgressBar {...defaultProps} />);
  });

  it("continous systematic progress", async () => {
    const defaultsysProps = {
      variant: PROGRESS_BAR_VARIANTS.SYSTEMATIC,
      label: "Downloading...",
      dataTestId: "progress-bar-systematic",
    };
    let progressValue = 95;
    if (progressValue < 100) {
      setTimeout(() => {
        progressValue += 1;
        const { getByTestId } = render(<ProgressBar {...defaultsysProps} value={progressValue} />);
        const progressEle = getByTestId("test-progress-bar-value");
        expect(getComputedStyle(progressEle).width).toBe(`${progressValue}%`);
      }, 1500);
    }
  });

  it("renders step progress", async () => {
    const defaultProps = {
      variant: PROGRESS_BAR_VARIANTS.MANUAL,
      value: 4,
      max: 10,
      label: "Downloading...",
      dataTestId: "progress-bar-manual",
    };
    const { getByTestId } = render(<ProgressBar {...defaultProps} />);
    const progressEle = getByTestId("test-progress-bar-value");
    expect(getComputedStyle(progressEle).width).toBe(`40%`);
  });

  it("value is greater than max", async () => {
    const defaultProps = {
      variant: PROGRESS_BAR_VARIANTS.MANUAL,
      value: 11,
      max: 10,
      label: "steps",
      dataTestId: "progress-bar-manual",
    };
    const { findByText } = render(<ProgressBar {...defaultProps} />);
    expect(await findByText("10/10")).toBeInTheDocument();
  });
  it("value is lesser than 0", async () => {
    const defaultProps = {
      variant: PROGRESS_BAR_VARIANTS.MANUAL,
      value: -1,
      max: 10,
      label: "steps",
      dataTestId: "progress-bar-manual",
    };
    const { findByText } = render(<ProgressBar {...defaultProps} />);
    expect(await findByText("0/10")).toBeInTheDocument();
  });
  it("value is lesser than 0", async () => {
    const defaultProps = {
      variant: PROGRESS_BAR_VARIANTS.MANUAL,
      value: 4,
      max: -1,
      label: "steps",
      dataTestId: "progress-bar-manual",
    };
    const { findByText } = render(<ProgressBar {...defaultProps} />);
    expect(await findByText("4/100")).toBeInTheDocument();
  });
});
