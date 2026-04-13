import React, { useCallback, useState } from "react";
import { DatePicker } from "@murv/datepicker";
import VisibilityToggleHelper, { IVisibilityToggleHelperRef } from "@murv/visibility-toggle";
import DropdownTrigger from "@murv/dropdown-trigger";
import { format, isValid } from "date-fns";
import { useMURVContext } from "@murv/provider";
import { SingleDateSelectProps } from "../types";

export const SingleDateSelect: React.FC<SingleDateSelectProps> = ({
  testId,
  label,
  orientation,
  date,
  disabled,
  timeValue,
  onDateChange = () => {},
  onTimeChange,
  withBorder,
  triggerType,
  maxBadgeWidth,
  renderButtonIcon,
  onDone,
  ...rest
}) => {
  const toggleRef = React.useRef<IVisibilityToggleHelperRef>(null);

  const murvContext = useMURVContext();

  const [selectedTime, setSelectedTime] = useState(timeValue);

  const renderTarget = useCallback(
    (props) => {
      const formattedDate =
        date && isValid(new Date(date)) ? format(new Date(date), "dd MMM yyyy") : null;
      const formattedTime = selectedTime ? ` ${selectedTime}` : "";
      let badgeText = null;

      if (onTimeChange && formattedDate) {
        badgeText = `${formattedDate}${formattedTime}`;
      } else if (formattedDate) {
        badgeText = formattedDate;
      }

      return (
        <DropdownTrigger
          primaryText={label}
          disabled={disabled}
          withBorder={withBorder}
          maxBadgeWidth={200}
          badgeText={badgeText}
          renderButtonIcon={renderButtonIcon}
          triggerType={triggerType}
          {...props}
        />
      );
    },
    [date, selectedTime],
  );

  const handleChange = (newDate: Date | string | number) => {
    onDateChange(newDate);
    if (!onDone) {
      toggleRef.current?.close();
    }
  };

  const handleTimeChange = (newTime: string, type: string) => {
    if (onTimeChange) onTimeChange(newTime, type);
    setSelectedTime(newTime);
  };

  const handleDone = () => {
    toggleRef.current?.close();
  };

  return (
    <VisibilityToggleHelper
      id="single-date-select"
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
      <DatePicker.Single
        date={date}
        testId={testId}
        onDateChange={handleChange}
        onTimeChange={onTimeChange ? handleTimeChange : undefined}
        onDone={onDone ? handleDone : undefined}
        timeValue={selectedTime}
        {...rest}
      />
    </VisibilityToggleHelper>
  );
};
