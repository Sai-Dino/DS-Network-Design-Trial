import React, { useRef } from "react";
import { RenderResult, render } from "test-utils";
import { renderHook } from "@testing-library/react-hooks";
import { FocusTrap, WithFocusTrap } from "../index";

const runFocusTrapTests = (
  renderContent: () => readonly [
    ReturnType<typeof renderHook<unknown, React.RefObject<HTMLButtonElement>>>,
    RenderResult,
  ],
) => {
  test("Should render the children as it is", () => {
    const [, doc] = renderContent();
    expect(doc.container).toHaveTextContent("Outside the Focus trapped area");
    expect(doc.getByTestId("button-0")).toBeDefined();
    expect(doc.getByTestId("button-1")).toBeDefined();
    expect(doc.getByTestId("button-2")).toBeDefined();
    expect(doc.getByTestId("button-3")).toBeDefined();
    expect(doc.getByTestId("button-4")).toBeDefined();
    const focusArea = doc.getByTestId("focus-area");
    expect(focusArea).toBeDefined();
    expect(focusArea).toHaveTextContent("Inside the Focus trapped area");
    expect(focusArea).toHaveTextContent("Button 1");
    expect(focusArea).toHaveTextContent("Button 2");
    expect(focusArea).toHaveTextContent("Button 3");
  });

  test("Should trap focus within", () => {
    const [{ waitFor }, doc] = renderContent();
    const tabKeyEvent = new KeyboardEvent("keydown", { key: "Tab" });
    const shiftTabKeyEvent = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true });
    const escapeKeyEvent = new KeyboardEvent("keydown", { key: "Escape" });
    doc.container.dispatchEvent(tabKeyEvent);
    waitFor(() => {
      expect(doc.getByTestId("button-0")).toHaveFocus();
    });
    doc.container.dispatchEvent(tabKeyEvent);
    waitFor(() => {
      expect(doc.getByTestId("button-1")).toHaveFocus();
    });
    doc.container.dispatchEvent(tabKeyEvent);
    waitFor(() => {
      expect(doc.getByTestId("button-2")).toHaveFocus();
    });
    doc.container.dispatchEvent(tabKeyEvent);
    waitFor(() => {
      expect(doc.getByTestId("button-3")).toHaveFocus();
    });
    doc.container.dispatchEvent(tabKeyEvent);
    waitFor(() => {
      expect(doc.getByTestId("button-1")).toHaveFocus();
      expect(doc.getByTestId("button-4")).not.toHaveFocus();
    });
    doc.container.dispatchEvent(shiftTabKeyEvent);
    waitFor(() => {
      expect(doc.getByTestId("button-3")).toHaveFocus();
      expect(doc.getByTestId("button-4")).not.toHaveFocus();
    });
    doc.container.dispatchEvent(escapeKeyEvent);
    waitFor(() => {
      expect(doc.getByTestId("button-4")).toHaveFocus();
    });
  });
};

describe("FocusTrap Component", () => {
  const renderContent = () => {
    const renderHookResult = renderHook(() => useRef<HTMLButtonElement>(null));

    const {
      result: { current: button4Ref },
    } = renderHookResult;

    const renderResult = render(
      <div>
        <p>Outside the Focus trapped area</p>
        <button type="button" data-testid="button-0">
          Button 0
        </button>
        <FocusTrap data-testid="focus-area" escapeHandler={() => button4Ref.current?.focus()}>
          <div>
            <p>Inside the Focus trapped area</p>
            <button type="button" data-testid="button-1">
              Button 1
            </button>
            <button type="button" data-testid="button-2">
              Button 2
            </button>
            <button type="button" data-testid="button-3">
              Button 3
            </button>
          </div>
        </FocusTrap>
        <button ref={button4Ref} type="button" data-testid="button-4">
          Button 4
        </button>
      </div>,
    );
    return [renderHookResult, renderResult] as const;
  };

  runFocusTrapTests(renderContent);
});

describe("WithFocusTrap HOC", () => {
  const renderContent = () => {
    const renderHookResult = renderHook(() => useRef<HTMLButtonElement>(null));

    const {
      result: { current: button4Ref },
    } = renderHookResult;

    const TestComponent: React.FC = () => (
      <div data-testid="focus-area">
        <p>Inside the Focus trapped area</p>
        <button type="button" data-testid="button-1">
          Button 1
        </button>
        <button type="button" data-testid="button-2">
          Button 2
        </button>
        <button type="button" data-testid="button-3">
          Button 3
        </button>
      </div>
    );

    const FocusTrappedComponent = WithFocusTrap(TestComponent, () => button4Ref.current?.focus());

    const renderResult = render(
      <div>
        <p>Outside the Focus trapped area</p>
        <button type="button" data-testid="button-0">
          Button 0
        </button>
        <FocusTrappedComponent />
        <button ref={button4Ref} type="button" data-testid="button-4">
          Button 4
        </button>
      </div>,
    );
    return [renderHookResult, renderResult] as const;
  };

  runFocusTrapTests(renderContent);
});
