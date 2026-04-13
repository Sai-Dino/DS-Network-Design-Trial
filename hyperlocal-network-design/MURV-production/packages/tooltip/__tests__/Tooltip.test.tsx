import React from "react";
import "@testing-library/jest-dom";
import { render, fireEvent } from "test-utils";
import { Tooltip } from "../src";

describe("Tooltip component testing", () => {
  it("Tooltip with icon", () => {
    const { getByText, getByTestId, container } = render(
      <Tooltip
        showIcon
        position="top"
        tooltipText="Friday is the new Saturday!"
        dataTestId="tooltip-1"
      >
        Hover here to see the secret message
      </Tooltip>,
    );
    const childrenElement = getByText("Hover here to see the secret message");
    fireEvent.mouseEnter(childrenElement);
    const tooltipElement = getByTestId("tooltip-1");
    expect(tooltipElement).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it("Tooltip without icon", () => {
    const { getByText, getByTestId, container } = render(
      <Tooltip
        showIcon={false}
        position="top"
        tooltipText="Friday is the new Saturday!"
        dataTestId="tooltip-2"
      >
        Hover here to see the secret message
      </Tooltip>,
    );
    const childrenElement = getByText("Hover here to see the secret message");
    fireEvent.mouseEnter(childrenElement);
    const tooltipElement = getByTestId("tooltip-2");
    expect(tooltipElement).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it("Tooltip with short text", () => {
    const { getByText, getByTestId, container } = render(
      <Tooltip
        showIcon
        position="top"
        tooltipText="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an"
        dataTestId="tooltip-3"
      >
        Hover here to see tooltip with short text
      </Tooltip>,
    );
    const childrenElement = getByText("Hover here to see tooltip with short text");
    fireEvent.mouseEnter(childrenElement);
    const tooltipElement = getByTestId("tooltip-3");
    expect(tooltipElement).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it("Tooltip with long text", () => {
    const { getByText, getByTestId, container } = render(
      <Tooltip
        showIcon
        position="top"
        tooltipText="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum."
        dataTestId="tooltip-3"
      >
        Hover here to see tooltip with long text
      </Tooltip>,
    );
    const childrenElement = getByText("Hover here to see tooltip with long text");
    fireEvent.mouseEnter(childrenElement);
    const tooltipElement = getByTestId("tooltip-3");
    expect(tooltipElement).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it("Tooltip mouse accessibility", () => {
    const { getByText, getByTestId } = render(
      <Tooltip
        showIcon
        position="top"
        tooltipText="Friday is the new Saturday!"
        dataTestId="tooltip"
      >
        Hover here to see the secret message
      </Tooltip>,
    );
    const childrenElement = getByText("Hover here to see the secret message");
    fireEvent.mouseEnter(childrenElement);
    const tooltipElement = getByTestId("tooltip");
    expect(tooltipElement).toBeInTheDocument();
    fireEvent.mouseLeave(childrenElement);
    expect(tooltipElement).not.toBeInTheDocument();
  });

  it("Tooltip keyboard accessibility", () => {
    const { getByText, getByTestId } = render(
      <Tooltip
        showIcon
        position="top"
        tooltipText="Friday is the new Saturday!"
        dataTestId="tooltip"
      >
        Hover here to see the secret message
      </Tooltip>,
    );
    const childrenElement = getByText("Hover here to see the secret message");
    childrenElement.focus();
    const tooltipElement = getByTestId("tooltip");
    expect(tooltipElement).toBeInTheDocument();
    childrenElement.blur();
    expect(tooltipElement).not.toBeInTheDocument();
  });

  it("Tooltip dismiss on pressing 'Esc'", () => {
    const { getByText, getByTestId } = render(
      <Tooltip
        showIcon
        position="top"
        tooltipText="Friday is the new Saturday!"
        dataTestId="tooltip"
      >
        Hover here to see the secret message
      </Tooltip>,
    );
    const childrenElement = getByText("Hover here to see the secret message");
    childrenElement.focus();
    const tooltipElement = getByTestId("tooltip");
    expect(tooltipElement).toBeInTheDocument();
    fireEvent.keyDown(childrenElement, {
      key: "Escape",
    });
    expect(tooltipElement).not.toBeInTheDocument();
  });
});
