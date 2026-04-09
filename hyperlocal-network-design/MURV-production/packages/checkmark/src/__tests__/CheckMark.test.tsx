import { RenderResult, render, fireEvent } from "test-utils";
import React, { useState } from "react";
import "@testing-library/jest-dom";
import { CheckMarkGroup } from "..";

describe("CheckMarkGroup Uncontrolled", () => {
  let screen = {} as RenderResult;

  beforeEach(() => {
    screen = render(
      <CheckMarkGroup
        dataTestId="checkMarkGroupFruit"
        name="fruit"
        options={[
          { label: "Apple", value: "apple" },
          {
            label: "Orange",
            value: "orange",
            inputProps: {
              defaultChecked: true,
            },
          },
        ]}
      />,
    );
  });

  test("renders correctly", () => {
    const checkMarkGroup = screen?.getByTestId("checkMarkGroupFruit");
    expect(checkMarkGroup).toBeInTheDocument();

    const checkMarkOption = screen?.getByLabelText("Apple");
    expect(checkMarkOption).toBeInTheDocument();

    const checkMarkInput = screen?.getByDisplayValue("orange");
    expect(checkMarkInput).toBeChecked();
  });

  test("CheckMark change event", () => {
    const checkMarkInput = screen?.getByDisplayValue("apple");
    fireEvent.click(checkMarkInput);
    expect(checkMarkInput).toBeChecked();
  });

  test("CheckMark Group snapshot", () => {
    expect(screen?.asFragment()).toMatchSnapshot();
  });

  afterEach(() => {
    screen.unmount();
  });
});

const WrappedControlledComponent = () => {
  const [value, setValue] = useState("bike");

  return (
    <CheckMarkGroup
      dataTestId="checkMarkGroupVehicle"
      name="vehicle"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      options={[
        {
          label: "Cycle",
          value: "cycle",
        },
        { label: "Bike", value: "bike" },
        {
          label: "Car",
          value: "car",
          disabled: true,
        },
      ]}
    />
  );
};

describe("CheckMarkGroup controlled", () => {
  let screen = {} as RenderResult;

  beforeEach(() => {
    screen = render(<WrappedControlledComponent />);
  });

  test("renders correctly", () => {
    const checkMarkGroup = screen?.getByTestId("checkMarkGroupVehicle");
    expect(checkMarkGroup).toBeInTheDocument();
  });

  test("Enabled option click", () => {
    const enabledCheckMarkOption = screen?.getByLabelText("Cycle");
    fireEvent.click(enabledCheckMarkOption);

    const enabledCheckMarkInput = screen?.getByDisplayValue("cycle");
    expect(enabledCheckMarkInput).toBeChecked();
  });

  test("Disabled Option", () => {
    const disabledCheckMarkInput = screen?.getByDisplayValue("car");

    expect(disabledCheckMarkInput).toBeDisabled();
  });

  test("CheckMark Group snapshot", () => {
    expect(screen?.asFragment()).toMatchSnapshot();
  });

  afterEach(() => {
    screen.unmount();
  });
});
