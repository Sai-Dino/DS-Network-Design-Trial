import React, { ReactElement, useImperativeHandle, useState } from "react";
import { Badge } from "@murv/badge";
import SingleSelect from "@murv/single-select";
import { DatePicker, IDateProps } from "@murv/datepicker";
import VisibilityToggleHelper, { IVisibilityToggleHelperRef } from "@murv/visibility-toggle";
import DropdownTrigger from "@murv/dropdown-trigger";
import { KeyboardArrowDown } from "@murv/icons";
import { useMURVContext } from "@murv/provider";
import {
  ISegmentedControlOptionsProps,
  ISegmentedControlProps,
  ISegmentedControlMoreOptionsProps,
  THandlerRef,
  ISegmentedControlDateRangeProps,
} from "./types";
import {
  OptionsInput,
  SegmentedControlOptionWrapper,
  SegmentedControlWrapper,
  StyledLegend,
} from "./styles";
import { SEGMENTED_CONTROL_LEGEND } from "./constants";

const SegmentedControlOptions: React.FC<ISegmentedControlOptionsProps> = ({
  text,
  badgeCount,
  isSelected,
  selectCurrentOption,
  defaultSelected = false,
  disabled = false,
  onClick = () => {},
  label,

  ...rest
}) => (
  <SegmentedControlOptionWrapper
    defaultSelected={defaultSelected}
    onClick={(e) => {
      if (!disabled) {
        onClick(e);
        if (selectCurrentOption) {
          selectCurrentOption();
        }
      }
      e.preventDefault();
    }}
    aria-disabled={disabled}
    disabled={disabled}
    isSelected={isSelected}
    {...rest}
  >
    {text}
    <OptionsInput type="radio" id={text} name={label} value={text} checked={isSelected} />
    {badgeCount ? (
      <Badge type="subtle" title={`${badgeCount}`} disabled={disabled}>
        {badgeCount}
      </Badge>
    ) : null}
  </SegmentedControlOptionWrapper>
);

const SegmentedControlMoreOptions: React.FC<ISegmentedControlMoreOptionsProps> = ({
  isSelected,
  selectCurrentOption,
  defaultSelected = false,
  disabled = false,
  onClick = () => {},
  moreOptionProps,
  text,
  label,
  ...rest
}) => (
  <SegmentedControlOptionWrapper
    defaultSelected={defaultSelected}
    onClick={(e) => {
      if (!disabled) {
        onClick(e);
        if (selectCurrentOption) {
          selectCurrentOption();
        }
      }
      e.preventDefault();
    }}
    aria-disabled={disabled}
    disabled={disabled}
    isSelected={isSelected}
    {...rest}
  >
    {moreOptionProps && (
      <SingleSelect
        triggerType="filter"
        orientation="vertical"
        label={text}
        name={label}
        {...moreOptionProps}
      />
    )}
  </SegmentedControlOptionWrapper>
);

const SegmentedControlDateRange: React.FC<ISegmentedControlDateRangeProps> = ({
  testId,
  dateRange,
  onDateChange,
  activeCalenderType,
  dateOutputFormat,
  onDone,
  onCancel,
  onTimeChange,
  defaultSelected = false,
  disabled = false,
  onClick = () => {},
  selectCurrentOption: originalSelectCurrentOption,
  isSelected,
  text = "Custom",
  id,
  minDate,
  maxDate,
  isDayDisabled,
  isMonthDisabled,
  isYearDisabled,
  dateRangeOptions,
  header,
  maxRange,
  weekStartsOn,
  ...rest
}) => {
  const toggleRef = React.useRef<IVisibilityToggleHelperRef>(null);
  const { theme } = useMURVContext();

  const renderTarget = React.useCallback(
    (props) => (
      <DropdownTrigger
        primaryText={text}
        disabled={disabled}
        withBorder={false}
        triggerType="filter"
        maxBadgeWidth={200}
        renderButtonIcon={() => <KeyboardArrowDown />}
        {...props}
      />
    ),
    [text, disabled],
  );

  const handleDone = (props: Pick<IDateProps, "dateRange" | "activeDate">) => {
    toggleRef.current?.close();
    if (onDone) onDone(props);
  };

  const handleCancel = () => {
    toggleRef.current?.close();
    if (onCancel) onCancel();
  };

  return (
    <SegmentedControlOptionWrapper
      defaultSelected={defaultSelected}
      onClick={(e) => {
        if (!disabled) {
          onClick(e);
          if (originalSelectCurrentOption) {
            originalSelectCurrentOption();
          }
        }
        e.preventDefault();
      }}
      aria-disabled={disabled}
      disabled={disabled}
      isSelected={isSelected}
      {...rest}
    >
      <VisibilityToggleHelper
        id={id}
        testId={testId}
        action="click"
        closeOnClickOutside
        isChildInteractive
        ref={toggleRef}
        position="bottom-start"
        renderTarget={renderTarget}
        popoverStyles={{
          boxShadow: `${theme.spacing[0]} ${theme.spacing.xxs} ${theme.spacing.s} ${theme.spacing.xxs} rgba(0, 0, 0, 0.08)`,
          borderRadius: `${theme.radius.xl}`,
        }}
      >
        <DatePicker.Range
          testId={testId}
          dateRange={dateRange}
          onDateChange={onDateChange}
          activeCalenderType={activeCalenderType}
          dateOutputFormat={dateOutputFormat}
          onDone={onDone ? handleDone : undefined}
          onCancel={onCancel ? handleCancel : undefined}
          minDate={minDate}
          maxDate={maxDate}
          isDayDisabled={isDayDisabled}
          isMonthDisabled={isMonthDisabled}
          isYearDisabled={isYearDisabled}
          dateRangeOptions={dateRangeOptions}
          header={header}
          maxRange={maxRange}
          onTimeChange={onTimeChange}
          weekStartsOn={weekStartsOn}
        />
      </VisibilityToggleHelper>
    </SegmentedControlOptionWrapper>
  );
};

const Root = React.forwardRef<THandlerRef, ISegmentedControlProps>((props, ref) => {
  const { id, dataTestId, children, legend = SEGMENTED_CONTROL_LEGEND } = props;
  /*
   * ? Handling fragments
   * Ignore react fragments if any, and render children
   * Else render children
   */
  const childToRender =
    React.isValidElement(children) && children.type === React.Fragment
      ? children.props.children
      : children;

  // Ensure childToRender is always an array
  const childrenArray = Array.isArray(childToRender) ? childToRender : [childToRender];

  /*
   * Handling selected options, and maintaining state internally
   */
  const selectedSegments = childrenArray.map(
    (child: ReactElement<{ defaultSelected: boolean }>) =>
      React.isValidElement(child) && child.props.defaultSelected,
  );
  const hasSelectedOptions = selectedSegments.some((isSelected: boolean) => isSelected);
  const selectedIndexExternal = hasSelectedOptions ? selectedSegments.indexOf(true) : null;
  const [selectedIndexInternalState, setSelectedIndexInternalState] = useState<number | null>(
    selectedIndexExternal,
  );
  /* 
    this added to add capabilty to change to default seclection.
    And also have cpability to reset the Selection.
  */
  const setSelectedIndex = (val?: number | null) => {
    setSelectedIndexInternalState(val ?? null);
  };
  useImperativeHandle(ref, () => ({
    setSelectedIndex,
  }));

  return (
    <SegmentedControlWrapper id={id} data-testid={dataTestId} aria-orientation="horizontal">
      <StyledLegend>{legend}</StyledLegend>
      {childrenArray.map(
        (
          child: ReactElement<{
            isSelected: boolean;
            selectCurrentOption: () => void;
            text?: string;
            label?: string;
            id?: string;
          }>,
          index: number,
        ) => {
          const uniqueKey =
            child.props.text || child.props.label || child.props.id || `segment-${index}`;

          return React.cloneElement(child, {
            key: uniqueKey,
            isSelected: selectedIndexInternalState === index,
            selectCurrentOption: () => {
              setSelectedIndexInternalState(index);
              if (child.props.selectCurrentOption) {
                child.props.selectCurrentOption();
              }
            },
          });
        },
      )}
    </SegmentedControlWrapper>
  );
});

Root.displayName = "SegmentedControl";

export const SegmentedControl = Object.assign(Root, {
  Option: SegmentedControlOptions,
  MoreOptions: SegmentedControlMoreOptions,
  DateRange: SegmentedControlDateRange,
});
