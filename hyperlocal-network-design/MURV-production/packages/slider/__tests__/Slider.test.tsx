import React from "react";
import { render, fireEvent, act, waitFor } from "test-utils";
import { Slider } from "../src";

const onChangeMock = jest.fn();
const commonTestProps = {
  dataTestId: "range-slider",
  placeholder: "Enter Text",
  onChange: onChangeMock,
  min: 0,
  max: 100,
  range: true,
  width: 200,
};

describe("Slider Component Test", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  test("check min & max value is present in Slider Range", () => {
    const { getByTestId } = render(<Slider {...commonTestProps} />);
    const sliderEle = getByTestId("range-slider") as HTMLDivElement;
    const { children } = sliderEle;
    const [primarySlider, secondarySlider] = [children.item(2), children.item(3)];
    const values = [
      primarySlider?.getAttribute("aria-valuemin"),
      secondarySlider?.getAttribute("aria-valuemax"),
    ].map((value) => Number(value));
    expect(values).toStrictEqual([0, 100]);
  });

  test("Move Slider in Slider Range", () => {
    const onMouseDown = jest.fn();
    const { getByTestId } = render(<Slider {...{ ...commonTestProps, onMouseDown }} />);
    const sliderEle = getByTestId("range-slider") as HTMLDivElement;

    const eventMap: any = {};
    document.addEventListener = jest.fn((event, callback) => {
      eventMap[event] = callback;
    });

    act(() => {
      fireEvent.pointerDown(sliderEle);
      fireEvent.pointerMove(sliderEle);
      expect(onMouseDown).toHaveBeenCalled();
      expect(onChangeMock).toHaveBeenCalled();
    });
  });
  test("Move Slider in Slider Range Value", () => {
    const onMouseDown = jest.fn();

    const { getByTestId } = render(<Slider {...{ ...commonTestProps, onMouseDown }} width={200} />);
    const sliderEle = getByTestId("range-slider") as HTMLDivElement;

    class MyPointerEvent extends MouseEvent {
      /* eslint-disable */
      constructor(type: string, params: any) {
        super(type, params);
      }
    }
    //@ts-ignore
    global.PointerEvent = MyPointerEvent;

    const { children } = sliderEle;
    const [primarySlider] = [children.item(2), children.item(3)];

    if (primarySlider) {
      waitFor(() => {
        fireEvent.pointerDown(primarySlider);
        fireEvent.pointerMove(sliderEle, { clientX: 300 });
        const value = primarySlider?.getAttribute("data-value");
        expect(value).toBe("100");
      });
    }
  });
});
