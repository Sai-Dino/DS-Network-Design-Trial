import React from "react";
import { render, fireEvent } from "test-utils";
import { TextBoxInput, TextAreaInput } from "../src";

const onChangeInput = jest.fn();
const commonTestProps = {
  testId: "text-input",
  value: "text value",
  placeholder: "Enter Text",
  onChange: onChangeInput,
  type: "text",
} as const;

describe("Input Component Test", () => {
  test("Input Value should render", () => {
    const { getByTestId } = render(<TextBoxInput {...commonTestProps} />);
    const inputEle = getByTestId("text-input") as HTMLInputElement;
    expect(inputEle.value).toBe("text value");
  });
  test("Input change on event fire", () => {
    const { getByTestId } = render(<TextBoxInput {...commonTestProps} />);
    const inputEle = getByTestId("text-input") as HTMLInputElement;
    fireEvent.change(inputEle, { target: { value: "Text val" } });
    expect(onChangeInput).toBeCalled();
  });

  test("Input hover on event fire", () => {
    const onHoverInput = jest.fn();
    const { getByTestId } = render(<TextBoxInput {...commonTestProps} onHover={onHoverInput} />);
    const inputEle = getByTestId("text-input") as HTMLInputElement;
    fireEvent.mouseEnter(inputEle);
    expect(onHoverInput).toHaveBeenCalled();
  });

  test("Input error", () => {
    const onHoverInput = jest.fn();
    const { container } = render(
      <TextBoxInput {...commonTestProps} onHover={onHoverInput} isError />,
    );
    const iconsEle = container.querySelector(".fk-icon");
    expect(iconsEle).toBeInTheDocument();

    expect(iconsEle?.textContent).toBe("Error");
  });
});

describe("TextArea Component Test", () => {
  test("TextArea Text Change", () => {
    const { getByTestId } = render(<TextAreaInput {...commonTestProps} />);
    const textAreaEle = getByTestId("text-input") as HTMLInputElement;
    fireEvent.change(textAreaEle, { target: { value: "Text Area val" } });
    expect(onChangeInput).toBeCalled();
  });
});
