import { RenderResult, fireEvent, render } from "test-utils";
import React, { useState } from "react";
import "@testing-library/jest-dom";
import { Toggle } from "..";

describe("Toggle Uncontrolled", () => {
  let screen = {} as RenderResult;

  beforeEach(() => {
    screen = render(
      <Toggle
        dataTestId="toggleUncontrolled"
        id="toggleUncontrolled"
        label="Toggle uncontrolled"
        value="uncontrolledToggle"
      />,
    );
  });

  test("renders correctly", () => {
    const toggle = screen?.getByTestId("toggleUncontrolled");
    expect(toggle).toBeInTheDocument();
  });

  test("Click", () => {
    const toggleInput = screen?.getByLabelText("Toggle uncontrolled");

    expect(toggleInput).not.toBeChecked();
    fireEvent.click(toggleInput);
    expect(toggleInput).toBeChecked();
  });

  test("Toggle snapshot", () => {
    expect(screen?.asFragment()).toMatchSnapshot();
  });

  afterEach(() => {
    screen.unmount();
  });
});

const WrappedComponent = () => {
  const [checked, setChecked] = useState(false);

  return (
    <Toggle
      dataTestId="toggleControlled"
      id="toggleControlled"
      label="Toggle controlled"
      value="controlledToggle"
      checked={checked}
      onChange={(e) => setChecked(e.target.checked)}
    />
  );
};

describe("Toggle controlled", () => {
  let screen = {} as RenderResult;

  beforeEach(() => {
    screen = render(<WrappedComponent />);
  });

  test("renders correctly", () => {
    const toggle = screen?.getByTestId("toggleControlled");
    expect(toggle).toBeInTheDocument();
  });

  test("Click", () => {
    const toggleInput = screen?.getByLabelText("Toggle controlled");

    expect(toggleInput).not.toBeChecked();
    fireEvent.click(toggleInput);
    expect(toggleInput).toBeChecked();
  });

  test("Toggle snapshot", () => {
    expect(screen?.asFragment()).toMatchSnapshot();
  });

  afterEach(() => {
    screen.unmount();
  });
});

describe("Toggle disabled", () => {
  let screen = {} as RenderResult;

  beforeEach(() => {
    screen = render(
      <Toggle
        dataTestId="toggledisabled"
        id="toggledisabled"
        label="Toggle disabled"
        value="disabledToggle"
        disabled
      />,
    );
  });

  test("renders correctly", () => {
    const toggle = screen?.getByTestId("toggledisabled");
    expect(toggle).toBeInTheDocument();
  });

  test("Click", () => {
    const toggleInput = screen?.getByLabelText("Toggle disabled");

    expect(toggleInput).toBeDisabled();
  });

  test("Toggle snapshot", () => {
    expect(screen?.asFragment()).toMatchSnapshot();
  });

  afterEach(() => {
    screen.unmount();
  });
});
