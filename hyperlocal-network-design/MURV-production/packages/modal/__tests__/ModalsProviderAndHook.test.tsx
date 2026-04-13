import { renderHook } from "@testing-library/react-hooks";
import { ModalsProvider, useModal } from "../src";

describe("ModalsProvider & useModal hook", () => {
  test("works as expected for each individual modal", () => {
    const {
      result: {
        current: [, { isVisible, isInStack }, { showModal, closeModal }],
      },
      waitFor,
    } = renderHook(() => useModal(), { wrapper: ModalsProvider });
    expect(isVisible).toBe(false);
    expect(isInStack).toBe(false);
    showModal();
    waitFor(() => {
      expect(isVisible).toBe(true);
      expect(isInStack).toBe(true);
    });
    closeModal();
    waitFor(() => {
      expect(isVisible).toBe(false);
      expect(isInStack).toBe(false);
    });
  });

  test("behaves as expected for in case of competing modals", () => {
    const {
      result: {
        current: [
          modalOneId,
          { isVisible: modalOneIsVisible, isInStack: modalOneIsInStack },
          { showModal: modalOneShow, closeModal: modalOneClose },
        ],
      },
      waitFor: modalOneWaitFor,
    } = renderHook(() => useModal(), { wrapper: ModalsProvider });
    const {
      result: {
        current: [
          modalTwoId,
          { isVisible: modalTwoIsVisible, isInStack: modalTwoIsInStack },
          { showModal: modalTwoShow, closeModal: modalTwoClose },
        ],
      },
      waitFor: modalTwoWaitFor,
    } = renderHook(() => useModal(), { wrapper: ModalsProvider });

    expect(modalOneId).not.toEqual(modalTwoId);

    expect(modalOneIsVisible).toBe(false);
    expect(modalOneIsInStack).toBe(false);
    expect(modalTwoIsVisible).toBe(false);
    expect(modalTwoIsInStack).toBe(false);

    modalOneShow();
    modalOneWaitFor(() => {
      expect(modalOneIsVisible).toBe(true);
      expect(modalOneIsInStack).toBe(true);
    });

    modalTwoShow();
    modalTwoWaitFor(() => {
      expect(modalTwoIsVisible).toBe(true);
      expect(modalTwoIsInStack).toBe(true);
    });
    modalOneWaitFor(() => {
      expect(modalOneIsVisible).toBe(false);
      expect(modalOneIsInStack).toBe(true);
    });

    modalTwoClose();
    modalTwoWaitFor(() => {
      expect(modalTwoIsVisible).toBe(false);
      expect(modalTwoIsInStack).toBe(false);
    });
    modalOneWaitFor(() => {
      expect(modalOneIsVisible).toBe(true);
      expect(modalOneIsInStack).toBe(true);
    });

    modalTwoShow();
    modalTwoWaitFor(() => {
      expect(modalTwoIsVisible).toBe(true);
      expect(modalTwoIsInStack).toBe(true);
    });
    modalOneWaitFor(() => {
      expect(modalOneIsVisible).toBe(false);
      expect(modalOneIsInStack).toBe(true);
    });

    modalOneClose();
    modalTwoWaitFor(() => {
      expect(modalTwoIsVisible).toBe(true);
      expect(modalTwoIsInStack).toBe(true);
    });
    modalOneWaitFor(() => {
      expect(modalOneIsVisible).toBe(false);
      expect(modalOneIsInStack).toBe(false);
    });
  });
});
