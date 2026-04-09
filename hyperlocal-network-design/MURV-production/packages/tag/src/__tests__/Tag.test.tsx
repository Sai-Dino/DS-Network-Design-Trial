import React from "react";
import "@testing-library/jest-dom";
import { render } from "test-utils";
import { Tag } from "../index";

describe("Tag component testing", () => {
  it("Tag default", () => {
    const { container } = render(<Tag tagText="New" id="tag" dataTestId="tag-testing" />);
    expect(container).toMatchSnapshot();
  });

  it("Tag left aligned", () => {
    const { container } = render(<Tag tagText="New" alignment="left" />);
    expect(container).toMatchSnapshot();
  });

  it("Tag regular alignment", () => {
    const { container } = render(<Tag tagText="New" alignment="regular" />);
    expect(container).toMatchSnapshot();
  });

  it("Tag red", () => {
    const { container } = render(<Tag tagText="New" tagStyle="red" />);
    expect(container).toMatchSnapshot();
  });

  it("Tag yellow", () => {
    const { container } = render(<Tag tagText="New" tagStyle="yellow" />);
    expect(container).toMatchSnapshot();
  });

  it("Tag green", () => {
    const { container } = render(<Tag tagText="New" tagStyle="green" />);
    expect(container).toMatchSnapshot();
  });

  it("Tag black", () => {
    const { container } = render(<Tag tagText="New" tagStyle="black" />);
    expect(container).toMatchSnapshot();
  });

  it("Tag grey", () => {
    const { container } = render(<Tag tagText="New" tagStyle="grey" />);
    expect(container).toMatchSnapshot();
  });

  it("Tag success", () => {
    const { container } = render(<Tag tagText="New" tagStyle="success" />);
    expect(container).toMatchSnapshot();
  });

  it("Tag rejected", () => {
    const { container } = render(<Tag tagText="New" tagStyle="rejected" />);
    expect(container).toMatchSnapshot();
  });

  it("Tag pending", () => {
    const { container } = render(<Tag tagText="New" tagStyle="pending" />);
    expect(container).toMatchSnapshot();
  });

  it("Tag expired", () => {
    const { container } = render(<Tag tagText="New" tagStyle="expired" />);
    expect(container).toMatchSnapshot();
  });

  it("Tag with custom colors", () => {
    const { container } = render(
      <Tag tagText="New" backgroundColor="#3b3b3b" textColor="#b3b3b3" />,
    );
    expect(container).toMatchSnapshot();
  });
});
