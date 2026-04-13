import { RenderResult, render, fireEvent } from "test-utils";
import React, { useState } from "react";
import "@testing-library/jest-dom";
import { RadioGroup } from "..";

describe("RadioGroup Uncontrolled", () => {
  let screen = {} as RenderResult;

  beforeEach(() => {
    screen = render(
      <RadioGroup
        dataTestId="radioGroupFruit"
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
    const radioGroup = screen?.getByTestId("radioGroupFruit");
    expect(radioGroup).toBeInTheDocument();

    const radioOption = screen?.getByLabelText("Apple");
    expect(radioOption).toBeInTheDocument();

    const radioInput = screen?.getByDisplayValue("orange");
    expect(radioInput).toBeChecked();
  });

  test("radio change event", () => {
    const radioInput = screen?.getByDisplayValue("apple");
    fireEvent.click(radioInput);
    expect(radioInput).toBeChecked();
  });

  test("Radio Group snapshot", () => {
    expect(screen?.asFragment()).toMatchSnapshot();
  });

  afterEach(() => {
    screen.unmount();
  });
});

const WrappedControlledComponent = () => {
  const [value, setValue] = useState("bike");

  return (
    <RadioGroup
      dataTestId="radioGroupVehicle"
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

describe("RadioGroup controlled", () => {
  let screen = {} as RenderResult;

  beforeEach(() => {
    screen = render(<WrappedControlledComponent />);
  });

  test("renders correctly", () => {
    const radioGroup = screen?.getByTestId("radioGroupVehicle");
    expect(radioGroup).toBeInTheDocument();
  });

  test("Enabled option click", () => {
    const enabledRadioOption = screen?.getByLabelText("Cycle");
    fireEvent.click(enabledRadioOption);

    const enabledRadioInput = screen?.getByDisplayValue("cycle");
    expect(enabledRadioInput).toBeChecked();
  });

  test("Disabled Option", () => {
    const disabledRadioInput = screen?.getByDisplayValue("car");

    expect(disabledRadioInput).toBeDisabled();
  });

  test("Radio Group snapshot", () => {
    expect(screen?.asFragment()).toMatchSnapshot();
  });

  afterEach(() => {
    screen.unmount();
  });
});
