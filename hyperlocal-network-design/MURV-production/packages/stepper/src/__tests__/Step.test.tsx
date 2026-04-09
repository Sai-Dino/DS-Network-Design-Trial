import React from "react";
import { render, fireEvent, screen } from "test-utils";
import { ITagStyle, StepPosition, Status, Orientation } from "../types";
import StepComponent from "../Step";

const commonTestProps = {
  testId: "text-step",
  orientation: Orientation.horizontal,
  position: "middle" as StepPosition,
  stepColor: "green",
  data: {
    name: "Step One",
    status: Status.completed,
    comments: "12-1-2024",
    statusLabel: "Success",
    tagStyle: "success" as ITagStyle,
  },
};

describe("Step Component Test", () => {
  it("snapshot test for Step component", () => {
    const { container } = render(<StepComponent {...commonTestProps} />);
    expect(container).toMatchSnapshot();
  });
  it("renders with default props", () => {
    const { getByTestId } = render(<StepComponent {...commonTestProps} />);
    expect(getByTestId(commonTestProps.testId)).toBeInTheDocument();
  });
  it("Step component test for horizontal orientation.", () => {
    const { getByTestId } = render(<StepComponent {...commonTestProps} />);
    // data alignment is opposite to the orientation.
    expect(getByTestId(commonTestProps.testId)).toHaveStyle(`flex-direction: column`);
  });
  it("Step component test for vertical orientation.", () => {
    const { getByTestId } = render(
      <StepComponent {...commonTestProps} orientation={Orientation.vertical} />,
    );
    // data alignment is opposite to the orientation.
    expect(getByTestId(commonTestProps.testId)).toHaveStyle(`flex-direction: row`);
  });
  it("Step component should render the elements", () => {
    const { getByText } = render(<StepComponent {...commonTestProps} />);
    // label
    expect(getByText(commonTestProps.data.statusLabel)).toBeInTheDocument();
    // name
    expect(getByText(commonTestProps.data.name)).toBeInTheDocument();
    // comments
    expect(getByText(commonTestProps.data.comments)).toBeInTheDocument();
  });
  it("End Step component should not render bar indicator", () => {
    render(<StepComponent {...commonTestProps} position="end" />);
    const submitButton = screen.queryByText(`${commonTestProps.testId}-bar`);
    expect(submitButton).toBeNull();
  });
  it("Step should render the custom html", () => {
    const onClickMock = jest.fn();
    const { getByText } = render(
      <StepComponent
        testId="text-step"
        orientation={Orientation.horizontal}
        position="middle"
        data={{
          name: "Step One",
          status: Status.completed,
          comments: "12-1-2024",
          statusLabel: "Success",
          children: (
            <button type="button" onClick={onClickMock}>
              Click me..
            </button>
          ),
          tagStyle: "success",
        }}
      />,
    );
    const buttonElement = getByText("Click me..");
    fireEvent.click(buttonElement);
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });
  it("Step component should render with provided color.", () => {
    const { getByTestId } = render(<StepComponent {...commonTestProps} />);
    expect(getByTestId(`${commonTestProps.testId}-circle`)).toBeInTheDocument();
    expect(getByTestId(`${commonTestProps.testId}-circle`)).toHaveStyle(
      `border: 2px solid ${commonTestProps.stepColor}`,
    );
    expect(getByTestId(`${commonTestProps.testId}-bar`)).toBeInTheDocument();
    expect(getByTestId(`${commonTestProps.testId}-bar`)).toHaveStyle(
      `background-color: ${commonTestProps.stepColor}`,
    );
  });
});
