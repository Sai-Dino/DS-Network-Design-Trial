import React from "react";
import "@testing-library/jest-dom";
import { render } from "murv/test-utils";
import { Loader } from "../src";

describe("Loader component testing", () => {
  it("Loader default", () => {
    const { container } = render(<Loader />);
    expect(container).toMatchSnapshot();
  });

  it("Loader with customer color", () => {
    const { container } = render(<Loader customColor="#3b3b3b" />);
    expect(container).toMatchSnapshot();
  });
});
