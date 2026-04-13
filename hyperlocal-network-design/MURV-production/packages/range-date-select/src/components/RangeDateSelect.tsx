import React, { useCallback, useMemo, useState } from "react";
import { DatePicker } from "@murv/datepicker";
import VisibilityToggleHelper, { IVisibilityToggleHelperRef } from "@murv/visibility-toggle";
import DropdownTrigger from "@murv/dropdown-trigger";
import { format } from "date-fns";
import { useMURVContext } from "@murv/provider";
import { RangeDateSelectProps } from "../types";

export const RangeDateSelect: React.FC<RangeDateSelectProps> = ({
  testId,
  label,
  orientation,
  disabled,
  withBorder,
  triggerType,
  maxBadgeWidth,
  renderButtonIcon,
  dateRange,
  startTime,
  endTime,
  onTimeChange,
  onDone,
  ...rest
}) => {
  const toggleRef = React.useRef<IVisibilityToggleHelperRef>(null);
  const murvContext = useMURVContext();
  const [selectedStartTime, setStartTime] = useState(startTime);
  const [selectedEndTime, setEndTime] = useState(endTime);

  const DATE_FORMAT = rest.dateOutputFormat?.formatStr || "dd MMM yyyy";

  const badgeText = useMemo(() => {
    const { startDate, endDate } = dateRange || {};
    if (startDate && endDate) {
      const formattedStart = `${format(startDate, DATE_FORMAT)}${onTimeChange ? ` ${selectedStartTime}` : ""}`;
      const formattedEnd = `${format(endDate, DATE_FORMAT)}${onTimeChange ? ` ${selectedEndTime}` : ""}`;
      return `${formattedStart} -> ${formattedEnd}`;
    }
    return null;
  }, [dateRange, selectedStartTime, selectedEndTime]);

  const renderTarget = useCallback(
    (props) => (
      <DropdownTrigger
        primaryText={label}
        disabled={disabled}
        withBorder={withBorder}
        triggerType={triggerType}
        maxBadgeWidth={200}
        badgeText={badgeText}
        renderButtonIcon={renderButtonIcon}
        {...props}
      />
    ),
    [dateRange],
  );

  const handleTimeChange = (newTime: string, type: string) => {
    if (type === "start") {
      setStartTime(newTime);
    } else if (type === "end") {
      setEndTime(newTime);
    }
    if (onTimeChange) {
      onTimeChange(newTime, type);
    }
  };

  const handleDone = () => {
    toggleRef.current?.close();
  };

  return (
    <VisibilityToggleHelper
      id="range-date-select"
      testId={testId}
      action="click"
      closeOnClickOutside
      isChildInteractive
      ref={toggleRef}
      position={orientation === "horizontal" ? "right-start" : "bottom-start"}
      renderTarget={renderTarget}
      popoverStyles={{
        boxShadow: "0px 4px 8px 4px rgba(0, 0, 0, 0.08)",
        borderRadius: `${murvContext.theme.radius.xl}`,
      }}
    >
      <DatePicker.Range
        {...rest}
        testId={testId}
        dateRange={dateRange}
        onTimeChange={onTimeChange ? handleTimeChange : undefined}
        startTime={selectedStartTime}
        endTime={selectedEndTime}
        onDone={onDone ? handleDone : undefined}
      />
    </VisibilityToggleHelper>
  );
};
