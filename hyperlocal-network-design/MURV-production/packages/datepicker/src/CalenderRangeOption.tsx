import React, { useState, useRef, useEffect } from "react";
import SegmentedControl, { THandlerRef } from "@murv/segmented-control";
import { IDateRange, IDateRangeOption, IDateRangeDetail } from "./types";
import { RangeBarContainer } from "./styles";

const CalenderRangeOption = ({
  dateRangeOptions,
  handleRangeSelect,
  dateRangeValue,
}: {
  dateRangeOptions: IDateRangeOption[];
  handleRangeSelect: (dateRange: IDateRange | null) => void;
  dateRangeValue: IDateRangeDetail;
}) => {
  const SELECT_LABEL = "More";
  const FOUR_TOP_OPTIONS = 4;
  const THREE_TOP_OPTIONS = 3;
  const DATE_RANGE_OPTIONS_LENGTH = dateRangeOptions.length;
  const noOfSliceTopItems =
    DATE_RANGE_OPTIONS_LENGTH > FOUR_TOP_OPTIONS ? THREE_TOP_OPTIONS : FOUR_TOP_OPTIONS;
  const getDefaultSecletetItem = dateRangeOptions.find((i) => i.defaultSelected);
  const myref = useRef<THandlerRef>(null);
  const [seclectedOption, SetSeclectedOption] = useState<string>("");
  // Get the index to map custom button in the array.
  const getCustomItemIndex = dateRangeOptions.findIndex((i) => i.isCustom);
  if (!dateRangeOptions[getCustomItemIndex]?.isCustom) {
    dateRangeOptions.unshift({
      title: "Custom",
      isCustom: true,
      defaultSelected: true,
      dateRange: {
        startDate: new Date(),
        endDate: new Date(),
      },
    });
  }

  const onSelectOption = (item: string) => {
    SetSeclectedOption(item);
    const seclectedDateRange: IDateRange | null =
      dateRangeOptions.find((i) => i.title === item)?.dateRange || null;
    handleRangeSelect(seclectedDateRange);
  };
  // Default Selection Functionality.
  useEffect(() => {
    if (getDefaultSecletetItem) {
      onSelectOption(getDefaultSecletetItem.title);
    }
  }, []);

  // This is added to replace the selected option to the custom seclection in the segmented Control.
  useEffect(() => {
    if (!dateRangeValue.endDate) {
      myref?.current?.setSelectedIndex(getCustomItemIndex);
      SetSeclectedOption(dateRangeOptions[getCustomItemIndex].title);
    }
  }, [dateRangeValue.endDate]);

  // Enhancing the array which will display in the Segmented Control.
  const topOptions = dateRangeOptions.slice(0, noOfSliceTopItems);

  // Enhancing the object which can consume by Single Select options props.
  const moreOptions = dateRangeOptions.slice(3).map((item) => ({
    label: item.title,
    value: item.title,
  }));

  // Adding the more option to the Array for refect in the segmented control.
  const segmentedControlOptions =
    DATE_RANGE_OPTIONS_LENGTH > FOUR_TOP_OPTIONS
      ? topOptions.concat({
          title: SELECT_LABEL,
          dateRange: null,
        })
      : topOptions;

  return (
    <RangeBarContainer>
      <SegmentedControl
        ref={myref}
        id="date-range-option-selector"
        dataTestId="date-range-option-selector"
      >
        {segmentedControlOptions.map((item) => {
          if (item.title === SELECT_LABEL) {
            return (
              <SegmentedControl.MoreOptions
                text={item.title}
                label={item.title}
                moreOptionProps={{
                  dataTestId: "date-range-more-options",
                  id: "date-range-more-options",
                  value: moreOptions.find((i) => i.value === seclectedOption)?.value,
                  onChange: (val: string) => onSelectOption(val),
                  options: moreOptions,
                }}
              />
            );
          }
          return (
            <SegmentedControl.Option
              key={`range-option-${item.title}`}
              text={item.title}
              label={item.title}
              defaultSelected={item.defaultSelected}
              onClick={() => onSelectOption(item.title)}
            />
          );
        })}
      </SegmentedControl>
    </RangeBarContainer>
  );
};

export default CalenderRangeOption;
