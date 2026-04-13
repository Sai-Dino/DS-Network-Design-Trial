import React, { useCallback, useRef, useState } from "react";
import { TextBoxInput } from "@murv/input";
import { ISliderProps } from "./types";
import {
  BaseSliderLine,
  Handler,
  InputContainer,
  SliderContainer,
  SliderRoot,
  TrackLine,
} from "./styles";
import {
  createSliderItemTestId,
  getBoundaryValue,
  roundValueToStep,
  getValue,
  getPosition,
} from "./utils";

const Slider = ({ min = 0, max = 100, ...sliderPorps }: ISliderProps) => {
  const {
    dataTestId = "default-slider-test-id",
    range,
    width = 200,
    disabled,
    onChange,
    onMouseDown,
    step,
    showInput,
  } = sliderPorps;

  const [value, setValue] = useState<number[]>([Number(min), Number(max)]);
  const handlerRef = useRef<HTMLDivElement>(null);
  const handlerRefs = useRef<HTMLDivElement[]>([]);
  const draggingHandleIndex = useRef(-1);

  const onMouseEnter = (e: MouseEvent) => {
    if (e.buttons === 0) {
      draggingHandleIndex.current = -1;
    }
  };

  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    if (draggingHandleIndex.current > -1) {
      const [minValue, maxValue] = value;
      let [minVal, maxVal] = [min, max];
      if (draggingHandleIndex.current === 0) {
        maxVal = maxValue;
      } else if (draggingHandleIndex.current === 1) {
        minVal = minValue;
      }
      let val = Math.round(
        getValue(
          e instanceof TouchEvent ? e.touches[0].clientX : e.clientX,
          minVal,
          maxVal,
          handlerRef,
        ),
      );

      if (step) {
        val = roundValueToStep(val, step);
      }
      val = getBoundaryValue(val, min, max);
      const nextValueArray = [...value];
      nextValueArray[draggingHandleIndex.current] = val;
      setValue([...nextValueArray]);
      if (onChange) {
        onChange(e, range ? nextValueArray : nextValueArray[1]);
      }
    }
  };

  const handleMouseUp = () => {
    draggingHandleIndex.current = -1;
    /* eslint-disable */
    removeGlobalEventListeners();
  };

  /**
   * Removes global event listeners.
   */
  const removeGlobalEventListeners = () => {
    document.body.removeEventListener("pointermove", handleMouseMove);
    document.body.removeEventListener("pointerenter", onMouseEnter);
    document.body.removeEventListener("pointerup", handleMouseUp);
    document.body.removeEventListener("touchmove", handleMouseMove);
    document.body.removeEventListener("touchend", handleMouseUp);
  };

  const addGlobalEventListeners = () => {
    document.body.addEventListener("pointermove", handleMouseMove);
    document.body.addEventListener("pointerenter", onMouseEnter);
    document.body.addEventListener("pointerup", handleMouseUp);
    document.body.addEventListener("touchmove", handleMouseMove);
    document.body.addEventListener("touchend", handleMouseUp);
  };

  const trackOffset = getPosition(range ? value[0] : min, min, max, handlerRef);
  const trackLeap = Math.abs(getPosition(value[1], min, max, handlerRef) - trackOffset);

  const renderInputText = useCallback(() => {
    const TEXT_LABEL = ["Minimum", "Maximum"];
    return (
      <InputContainer>
        {range ? (
          value.map((val, ind) => (
            <TextBoxInput
              label={TEXT_LABEL[ind]}
              width={10}
              value={val}
              placeholder="0"
              onChange={(ev) => {
                setValue((prevValue: number[]) => {
                  const newValue = [...prevValue];
                  newValue[ind] = parseInt(ev.target.value, 10);
                  return [...newValue];
                });
              }}
              htmlProps={{ value: val }}
            />
          ))
        ) : (
          <TextBoxInput
            label="Value"
            width={10}
            value={value[1]}
            placeholder="0"
            onChange={(ev) => {
              setValue((prevValue: number[]) => {
                const newValue = [...prevValue];
                newValue[1] = parseInt(ev.target.value, 10);
                return [...newValue];
              });
            }}
            htmlProps={{ value: value[1] }}
          />
        )}
      </InputContainer>
    );
  }, [value]);

  const handleKeydown = (ev: React.KeyboardEvent<HTMLDivElement>) => {
    const index = Number(ev.currentTarget.getAttribute("data-index"));
    const prevValue = value[index];

    switch (ev.key) {
      case "ArrowRight": {
        // it step is given it will increment the value else standard 10%
        let val = step ? prevValue + step : prevValue + 10;
        if (step) {
          val = roundValueToStep(val, step);
        }
        val = getBoundaryValue(val, min, max);
        const nextValueArray = [...value];
        nextValueArray[index] = val;
        setValue([...nextValueArray]);

        return;
      }
      case "ArrowLeft": {
        // it step is given it will decrement the value else standard 10%
        let val = step ? prevValue - step : prevValue - 10;
        if (step) {
          val = roundValueToStep(val, step);
        }
        val = getBoundaryValue(val, min, max);
        const nextValueArray = [...value];
        nextValueArray[index] = val;
        setValue([...nextValueArray]);
        break;
      }

      default:
        break;
    }
  };

  const onHandleDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (disabled) {
      return;
    }
    if (onMouseDown) {
      onMouseDown(e);
    }
    e.preventDefault();
    if (handlerRefs.current && handlerRef.current && document.activeElement) {
      if (handlerRefs.current.indexOf(e.target as HTMLDivElement) > -1) {
        const ind = handlerRefs.current.indexOf(e.target as HTMLDivElement);
        draggingHandleIndex.current = ind;
        addGlobalEventListeners();
      } else {
        const Xmin = handlerRef.current.getBoundingClientRect().left;
        const clientPosX = e.clientX - Xmin;
        const handleDistances = value.map((val) =>
          Math.abs(getPosition(val, min, max, handlerRef) - clientPosX),
        );
        const handleToMove = handleDistances.indexOf(Math.min(...handleDistances));
        const nextValueArray = [...value];
        nextValueArray[handleToMove] = Math.round(
          getValue(
            e instanceof TouchEvent ? e.touches[0].clientX : e.clientX,
            min,
            max,
            handlerRef,
          ),
        );
        if (nextValueArray[0] <= nextValueArray[1]) {
          setValue([...nextValueArray]);
          if (onChange) {
            onChange(e, nextValueArray);
          }
        }
      }
    }
  };

  return (
    <SliderRoot>
      <SliderContainer
        width={width}
        ref={handlerRef}
        onPointerDown={onHandleDown}
        data-testId={dataTestId}
      >
        <BaseSliderLine />
        <TrackLine width={trackLeap} left={trackOffset} />
        {value.map((val, ind) => (
          <Handler
            display={!range && ind === 0 ? "none" : "block"}
            onKeyDown={handleKeydown}
            role="slider"
            key={createSliderItemTestId(ind, val)}
            {...(disabled && { tabIndex: 0 })}
            ref={(_ref) => {
              if (_ref) {
                handlerRefs.current[ind] = _ref;
              }
            }}
            tabIndex={0}
            positionX={getPosition(val, min, max, handlerRef)}
            data-index={ind}
            data-value={val}
            onFocus={(e) => {
              const index = Number(e.currentTarget.getAttribute("data-index"));
              draggingHandleIndex.current = index;
            }}
            onBlur={() => {
              draggingHandleIndex.current = -1;
            }}
            aria-label="range-slider"
            aria-labelledby="range-slider"
            aria-orientation="horizontal"
            aria-valuemax={max}
            aria-valuemin={min}
            aria-valuenow={val}
            aria-valuetext={"range"}
          />
        ))}
      </SliderContainer>
      {showInput ? renderInputText() : null}
    </SliderRoot>
  );
};

export { Slider };
