import React from "react";
import { render } from "test-utils";
import { Stepper } from "../Stepper";
import { Status, Orientation, ITagStyle } from "../types";

const commonTestProps = {
  testId: "text-stepper",
  orientation: Orientation.horizontal,
  color: "green",
  data: [
    {
      name: "Step One",
      status: Status.completed,
      comments: "12-1-2024 ",
      statusLabel: "Success",
      tagStyle: "success" as ITagStyle,
    },
    {
      name: "Step Two",
      status: Status.completed,
      comments: "12-1-2024 ",
      statusLabel: "Success",
      tagStyle: "success" as ITagStyle,
    },
    {
      name: "Step Three",
      status: Status.inProgress,
      comments: "12-1-2024",
      statusLabel: "Pending",
      tagStyle: "pending" as ITagStyle,
    },
    {
      name: "Step Four",
      status: Status.incomplete,
      comments: "12-1-2024 ",
      statusLabel: "Pending",
      tagStyle: "grey" as ITagStyle,
    },
    {
      name: "Step Five",
      status: Status.incomplete,
      comments: "12-1-2024 ",
      statusLabel: "Pending",
      tagStyle: "grey" as ITagStyle,
    },
  ],
};

describe("Stepper Component Test", () => {
  it("renders with default props", () => {
    const { getByTestId } = render(<Stepper {...commonTestProps} />);
    expect(getByTestId(commonTestProps.testId)).toBeInTheDocument();
  });
  it("snapshot test for Stepper component", () => {
    const { container } = render(<Stepper {...commonTestProps} />);
    expect(container).toMatchSnapshot();
  });

  it("Stepper component test for horizontal rendering.", () => {
    const { getByTestId } = render(<Stepper {...commonTestProps} />);
    expect(getByTestId(commonTestProps.testId)).toHaveStyle(`flex-direction: row`);
  });
  it("Stepper component test for horizontal rendering.", () => {
    const { getByTestId } = render(
      <Stepper {...commonTestProps} orientation={Orientation.vertical} />,
    );
    expect(getByTestId(commonTestProps.testId)).toHaveStyle(`flex-direction: column`);
  });
  it("Stepper component: completed state steps should render with provided color.", () => {
    const { getByTestId } = render(
      <Stepper {...commonTestProps} orientation={Orientation.vertical} />,
    );
    commonTestProps?.data?.forEach((step, ind) => {
      if (step.status === Status.completed) {
        const testId = `${commonTestProps.testId}-step-${ind}`;
        expect(getByTestId(`${testId}-circle`)).toBeInTheDocument();
        expect(getByTestId(`${testId}-bar`)).toBeInTheDocument();
        expect(getByTestId(`${testId}-circle`)).toHaveStyle(
          `border: 2px solid ${commonTestProps.color}`,
        );
        expect(getByTestId(`${testId}-bar`)).toHaveStyle(
          `background-color: ${commonTestProps.color}`,
        );
      }
    });
  });
});
