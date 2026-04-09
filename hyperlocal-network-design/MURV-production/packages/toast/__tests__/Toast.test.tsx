import React from "react";
import "@testing-library/jest-dom";
import { ButtonGroupProps } from "@murv/button-group";
import { Add } from "@murv/icons";
import { render, fireEvent, within, waitFor, act } from "murv/test-utils";
import { Toast, ToastComponent } from "../src";

const message = "my message";
const onCloseCB = jest.fn;

const buttonGroupProps: ButtonGroupProps = {
  buttons: [
    {
      buttonType: "inline",
      buttonStyle: "brand",
      PrefixIcon: Add,
      onClick: jest.fn,
    },
    {
      buttonType: "inline",
      buttonStyle: "brand",
      children: "Button",
      onClick: jest.fn,
    },
  ],
  alignment: "right",
  padding: "0px",
};

describe("Toast method works correctly", () => {
  it("renders a success toast and autocloses it", async () => {
    const testId = "toast1";
    const ToastWrapper: React.FC = () => (
      <div>
        <button
          type="button"
          onClick={() =>
            Toast.success({
              message,
              buttonGroupProps,
              dataTestId: testId,
            })
          }
        >
          Click Me1
        </button>
        <ToastComponent />
      </div>
    );
    const { getByText, findByTestId } = render(<ToastWrapper />);
    const openToast = getByText("Click Me1");
    await act(async () => {
      fireEvent.click(openToast);
    });
    const toast = await waitFor(() => findByTestId(`toast-success-${testId}`), { timeout: 3000 });
    const toastMessage = within(toast).getByText(message);
    expect(toast).not.toBeEmptyDOMElement();
    expect(toastMessage).not.toBeEmptyDOMElement();
    setTimeout(async () => {
      const toastClosed = await findByTestId(`toast-success-${testId}`);
      expect(toastClosed).toBeEmptyDOMElement();
    }, 5000);
  });

  it("renders a Warning toast and autocloses it at updated time", async () => {
    const testId = "toast2";
    const ToastWrapper: React.FC = () => (
      <div>
        <button
          type="button"
          onClick={() =>
            Toast.information({
              message,
              dataTestId: testId,
              autoClose: 3000,
            })
          }
        >
          Click Me2
        </button>
        <ToastComponent />
      </div>
    );
    const { getByText, findByTestId } = render(<ToastWrapper />);
    const openToast = await getByText("Click Me2");
    fireEvent.click(openToast);
    const toast = await findByTestId(`toast-information-${testId}`);
    const toastMessage = within(toast).getByText(message);
    expect(toast).not.toBeEmptyDOMElement();
    expect(toastMessage).not.toBeEmptyDOMElement();
    setTimeout(async () => {
      const toastClosed = await findByTestId(`toast-information-${testId}`);
      expect(toastClosed).toBeEmptyDOMElement();
    }, 3000);
  });

  it("renders a error toast and autocloses it, calls callback on close", async () => {
    const testId = "toast3";
    const ToastWrapper: React.FC = () => (
      <div>
        <button
          type="button"
          onClick={() => Toast.error({ message, dataTestId: testId, autoClose: 3000 })}
        >
          Click Me3
        </button>
        <ToastComponent />
      </div>
    );
    const { getByText, findByTestId } = render(<ToastWrapper />);
    const openToast = await getByText("Click Me3");
    fireEvent.click(openToast);
    const toast = await findByTestId(`toast-error-${testId}`);
    const toastMessage = within(toast).getByText(message);
    expect(toast).not.toBeEmptyDOMElement();
    expect(toastMessage).not.toBeEmptyDOMElement();
    setTimeout(async () => {
      const toastClosed = await findByTestId(`toast-error-${testId}`);
      expect(toastClosed).toBeEmptyDOMElement();
      expect(onCloseCB).toHaveBeenCalled();
    }, 3000);
  });
});

describe("openToastWithCloseBtn works correctly", () => {
  it("renders a success toast with closebtn and auto closes it", async () => {
    const testId = "toast4";
    const ToastWrapper: React.FC = () => (
      <div>
        <button type="button" onClick={() => Toast.success({ message, dataTestId: testId })}>
          Click Me4
        </button>
        <ToastComponent />
      </div>
    );
    const { getByText, findByTestId } = render(<ToastWrapper />);
    const openToast = await getByText("Click Me4");
    fireEvent.click(openToast);
    const toast = await findByTestId(`toast-success-${testId}`);
    const toastMessage = within(toast).getByText(message);
    expect(toast).not.toBeEmptyDOMElement();
    expect(toastMessage).not.toBeEmptyDOMElement();
    const closeBtn = await findByTestId(`toast-close-btn-${testId}`);
    expect(closeBtn).not.toBeEmptyDOMElement();
    setTimeout(async () => {
      const toastClosed = await findByTestId(`toast-success-${testId}`);
      expect(toastClosed).toBeEmptyDOMElement();
    }, 5000);
  });

  it("renders a information toast with close btn and autocloses it at updated time", async () => {
    const testId = "toast5";
    const ToastWrapper: React.FC = () => (
      <div>
        <button
          type="button"
          onClick={() => Toast.information({ message, dataTestId: testId, autoClose: 6000 })}
        >
          Click Me5
        </button>
        <ToastComponent />
      </div>
    );
    const { getByText, findByTestId } = render(<ToastWrapper />);
    const openToast = await getByText("Click Me5");
    fireEvent.click(openToast);
    const toast = await findByTestId(`toast-information-${testId}`);
    const toastMessage = within(toast).getByText(message);
    expect(toast).not.toBeEmptyDOMElement();
    expect(toastMessage).not.toBeEmptyDOMElement();
    const closeBtn = await findByTestId(`toast-close-btn-${testId}`);
    expect(closeBtn).not.toBeEmptyDOMElement();
    setTimeout(async () => {
      const toastClosed = await findByTestId(`toast-information-${testId}`);
      expect(toastClosed).toBeEmptyDOMElement();
    }, 6000);
  });

  it("renders a information toast with close btn and autocloses it at updated time, and calls cb on auto close", async () => {
    const testId = "toast6";
    const ToastWrapper: React.FC = () => (
      <div>
        <button
          type="button"
          onClick={() =>
            Toast.information({
              message,
              dataTestId: testId,
              autoClose: 3000,
              onCloseCallback: onCloseCB,
            })
          }
        >
          Click Me6
        </button>
        <ToastComponent />
      </div>
    );
    const { getByText, findByTestId } = render(<ToastWrapper />);
    const openToast = await getByText("Click Me6");
    fireEvent.click(openToast);
    const toast = await findByTestId(`toast-information-${testId}`);
    const toastMessage = within(toast).getByText(message);
    expect(toast).not.toBeEmptyDOMElement();
    expect(toastMessage).not.toBeEmptyDOMElement();
    const closeBtn = await findByTestId(`toast-close-btn-${testId}`);
    expect(closeBtn).not.toBeEmptyDOMElement();
    setTimeout(async () => {
      const toastClosed = await findByTestId(`toast-information-${testId}`);
      expect(toastClosed).toBeEmptyDOMElement();
      expect(onCloseCB).toHaveBeenCalled();
    }, 3000);
  });

  it("renders a error toast, calls callback on clicking close", async () => {
    const testId = "toast7";
    const ToastWrapper: React.FC = () => (
      <div>
        <button
          type="button"
          onClick={() => Toast.error({ message, dataTestId: testId, onCloseCallback: onCloseCB })}
        >
          Click Me7
        </button>
        <ToastComponent />
      </div>
    );
    const { getByText, findByTestId } = render(<ToastWrapper />);
    const openToast = await getByText("Click Me7");
    fireEvent.click(openToast);
    const toast = await findByTestId(`toast-error-${testId}`);
    const toastMessage = within(toast).getByText(message);
    expect(toast).not.toBeEmptyDOMElement();
    expect(toastMessage).not.toBeEmptyDOMElement();
    const closeBtn = await findByTestId(`toast-close-btn-${testId}`);
    fireEvent.click(closeBtn);
    setTimeout(async () => {
      const toastClosed = await findByTestId(`toast-error-${testId}`);
      expect(toastClosed).toBeEmptyDOMElement();
      expect(onCloseCB).toHaveBeenCalled();
    }, 1);
  });
});
