import React from "react";
import { render, fireEvent } from "test-utils";
import { Rating } from "../Rating";

describe("Rating component", () => {
  it("renders with default props", () => {
    const { container } = render(<Rating dataTestId="raiting-all-props" rating={0} readOnly={false} />);
    expect(container).toBeInTheDocument();
  });

  it("renders with disabled props", () => {
    const { container } = render(<Rating readOnly rating={0} />);
    expect(container).toBeInTheDocument();
  });

  it("renders with all props", () => {
    const { container } = render(
      <Rating dataTestId="raiting-all-props" rating={2} readOnly />,
    );
    expect(container).toBeInTheDocument();
  });

  it("allows keyboard navigation", () => {
    const onChangeMock = jest.fn();
    const { container } = render(<Rating rating={0} onChange={onChangeMock} />);
    const stars = container.querySelectorAll("[type='radio']") as NodeListOf<HTMLInputElement>;
    fireEvent.keyDown(stars[0], { key: "ArrowRight" });
    expect(document.activeElement?.id).toBe(stars[1].id);
    fireEvent.keyDown(stars[1], { key: "ArrowLeft" });
    expect(document.activeElement?.id).toBe(stars[0].id);
  });

  it("calls onChange handler when a star is clicked", () => {
    const onChangeMock = jest.fn();
    const { container } = render(<Rating onChange={onChangeMock} rating={2} readOnly={false} />);
    const stars = container.querySelectorAll("[type='radio']") as NodeListOf<HTMLInputElement>;
    fireEvent.click(stars[2]);
    expect(onChangeMock).toHaveBeenCalledWith(3);
  });
});
