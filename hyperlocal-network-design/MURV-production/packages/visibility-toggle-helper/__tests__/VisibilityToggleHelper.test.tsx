import React from "react";
import { fireEvent, render, screen, waitFor } from "test-utils";
import {
  VisibilityToggleHelper,
  IVisibilityToggleHelperProps,
  IVisibilityToggleHelperRef,
} from "../src";

const WrapperComponent = (
  props: Omit<IVisibilityToggleHelperProps, "renderTarget" | "children">,
) => (
  <div>
    <div id="outside-element" data-testid="outside-element">
      Outside
    </div>
    <VisibilityToggleHelper
      {...props}
      renderTarget={(targetProps) => (
        <button {...targetProps} style={{ width: "80px", height: "40px" }} type="button">
          target
        </button>
      )}
    >
      <div style={{ width: "100px", height: "30px" }}>I am popover</div>
    </VisibilityToggleHelper>
  </div>
);

const WrapperComponentWithRef = (
  props: Omit<IVisibilityToggleHelperProps, "renderTarget" | "children">,
) => {
  const toggleRef = React.useRef<IVisibilityToggleHelperRef>(null);

  return (
    <div>
      <VisibilityToggleHelper
        {...props}
        ref={toggleRef}
        renderTarget={(targetProps) => (
          <button {...targetProps} style={{ padding: "4px" }} type="button">
            Target
          </button>
        )}
      >
        <div style={{ padding: "8px", backgroundColor: "cyan" }}>
          I am Visible Now
          <button
            style={{ padding: "4px", marginLeft: "8px", cursor: "pointer" }}
            type="button"
            onClick={() => {
              // eslint-disable-next-line no-console
              console.log("Close button clicked");
              toggleRef.current?.close();
            }}
          >
            Click to close
          </button>
        </div>
      </VisibilityToggleHelper>
    </div>
  );
};

describe("VisibilityToggleHelper", () => {
  test("Renders VisibilityToggleHelper component with Default Props", () => {
    render(<WrapperComponent id="test" />);
    const triggerNode = screen.getByTestId("trigger-test");
    expect(triggerNode).toBeInTheDocument();
    expect(triggerNode).toHaveTextContent("target");
    fireEvent.mouseOver(screen.getByText("target"));
    const popOverNode = screen.getByTestId("content-test");
    expect(popOverNode).toBeInTheDocument();
    expect(popOverNode).toHaveTextContent("I am popover");
    waitFor(() => {
      expect(popOverNode.hidden).toBe(false);
    });
  });

  test("Renders VisibilityToggleHelper component with initialIsVisible prop", () => {
    render(<WrapperComponent initialIsVisible id="test" />);
    const triggerNode = screen.getByTestId("trigger-test");
    expect(triggerNode).toBeInTheDocument();
    const popOverNode = screen.getByTestId("content-test");
    expect(popOverNode).toBeInTheDocument();
    expect(popOverNode).toHaveTextContent("I am popover");
    expect(popOverNode.hidden).toBe(false);
  });

  test("Renders VisibilityToggleHelper component with action=click", () => {
    render(<WrapperComponent id="test" testId="test" action="click" />);
    const triggerNode = screen.getByTestId("trigger-test");
    const popOverNode = screen.getByTestId("content-test");
    expect(popOverNode).toBeInTheDocument();
    expect(popOverNode.hidden).toBe(true);
    fireEvent.click(triggerNode);
    expect(popOverNode.hidden).toBe(false);
  });

  test("Renders VisibilityToggleHelper component with offset prop", async () => {
    const tree = render(
      <WrapperComponent initialIsVisible id="test" testId="test" offset={{ x: 10, y: 10 }} />,
    );
    const triggerNode = screen.getByTestId("trigger-test");
    expect(triggerNode).toBeInTheDocument();
    const popOverNode = screen.getByTestId("content-test");
    expect(popOverNode).toBeInTheDocument();
    expect(popOverNode.hidden).toBe(false);
    fireEvent.mouseOver(screen.getByText("target"));
    await waitFor(() => {
      expect(popOverNode.hidden).toBe(false);
    });
    expect(tree).toMatchSnapshot();
  });

  test("Renders VisibilityToggleHelper component with closeOnClickOutside prop", () => {
    render(<WrapperComponent id="test" testId="test" closeOnClickOutside action="click" />);
    const triggerNode = screen.getByTestId("trigger-test");
    expect(triggerNode).toBeInTheDocument();
    const popOverNode = screen.getByTestId("content-test");
    expect(popOverNode).toBeInTheDocument();
    expect(popOverNode.hidden).toBe(true);
    fireEvent.click(triggerNode);
    waitFor(() => {
      expect(popOverNode.hidden).toBe(false);
    });
    // Click on the popover
    fireEvent.click(popOverNode);
    expect(popOverNode.hidden).toBe(false);
    // Click outside the popover
    const outsideElement = screen.getByTestId("outside-element");
    fireEvent.click(outsideElement);
    waitFor(() => {
      expect(popOverNode.hidden).toBe(false);
    });
  });

  test("Renders Interactive child", () => {
    render(<WrapperComponent id="test" testId="test" isChildInteractive />);
    const triggerNode = screen.getByTestId("trigger-test");
    const popOverNode = screen.getByTestId("content-test");
    expect(triggerNode).toBeInTheDocument();
    fireEvent.mouseOver(triggerNode);
    waitFor(() => {
      expect(popOverNode.hidden).toBe(false);
    });
    expect(popOverNode).toBeInTheDocument();
    fireEvent.mouseOver(popOverNode);
    const outsideElement = screen.getByTestId("outside-element");
    fireEvent.mouseOver(outsideElement);
    waitFor(() => {
      expect(popOverNode.hidden).toBe(true);
    });
  });

  test("Imperative handle", () => {
    render(<WrapperComponentWithRef id="test" testId="test" />);
    const triggerNode = screen.getByTestId("trigger-test");
    const popOverNode = screen.getByTestId("content-test");
    expect(triggerNode).toBeInTheDocument();
    fireEvent.click(triggerNode);
    waitFor(() => {
      expect(popOverNode.hidden).toBe(false);
    });
    const closeButton = screen.getByText("Click to close");
    fireEvent.click(closeButton);
    waitFor(() => {
      expect(popOverNode.hidden).toBe(true);
    });
  });
});
