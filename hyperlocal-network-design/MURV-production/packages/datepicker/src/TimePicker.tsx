import React, { useState, useEffect, useRef } from "react";
import { ITimePickerProps } from "./types";
import { TimePickerWrapper, FlexDiv, Colon, MeridiemContainer, MeridiemBox, Input } from "./styles";

const TimePicker = ({
  startTime,
  endTime,
  timeValue,
  onTimeChange,
  type = "single",
}: ITimePickerProps) => {
  const getCurrentTime = () => {
    const now = new Date();
    let h = now.getHours();
    const m = now.getMinutes();
    const isAM = h < 12;

    if (h > 12) h -= 12;
    if (h === 0) h = 12;

    return {
      hour: String(h).padStart(2, "0"),
      minute: String(m).padStart(2, "0"),
      meridiem: isAM ? "AM" : "PM",
    };
  };

  const parseTimeString = (timeStr: string) => {
    try {
      const [time, ampm] = timeStr.split(" ");
      const [h, m] = time.split(":");

      return {
        hour: h.length === 1 ? `0${h}` : h,
        minute: m,
        meridiem: ampm,
      };
    } catch {
      return getCurrentTime();
    }
  };

  const determineInitialTime = () => {
    if (type === "start" && startTime) {
      return parseTimeString(startTime);
    }
    if (type === "end" && endTime) {
      return parseTimeString(endTime);
    }
    if ((type === "single" || type === "start") && timeValue) {
      return parseTimeString(timeValue);
    }
    return getCurrentTime();
  };

  const initialTime = determineInitialTime();

  const [hour, setHour] = useState<string>(initialTime.hour);
  const [minute, setMinute] = useState<string>(initialTime.minute);
  const [meridiem, setMeridiem] = useState<string>(initialTime.meridiem);

  const minuteInputRef = useRef<HTMLInputElement | null>(null);
  const hourInputRef = useRef<HTMLInputElement | null>(null);
  const isInitialMount = useRef<boolean>(true);
  const hourDigitsEntered = useRef<number>(0);

  useEffect(() => {
    if (isInitialMount.current && type === "single" && !timeValue) {
      const currentTimeString = `${hour}:${minute} ${meridiem}`;
      onTimeChange?.(currentTimeString, type);
      isInitialMount.current = false;
    }
  }, []);

  useEffect(() => {
    if (timeValue && type === "single") {
      const parsed = parseTimeString(timeValue);
      setHour(parsed.hour);
      setMinute(parsed.minute);
      setMeridiem(parsed.meridiem);
    }
  }, [timeValue, type]);

  useEffect(() => {
    if (!isInitialMount.current) return;

    if (type === "start" && startTime) {
      const parsed = parseTimeString(startTime);
      setHour(parsed.hour);
      setMinute(parsed.minute);
      setMeridiem(parsed.meridiem);
    } else if (type === "end" && endTime) {
      const parsed = parseTimeString(endTime);
      setHour(parsed.hour);
      setMinute(parsed.minute);
      setMeridiem(parsed.meridiem);
    }

    isInitialMount.current = false;
  }, [startTime, endTime, type]);

  const updateParentTime = (h: string, m: string, mer: string = meridiem) => {
    if (h && m) {
      const formattedHour = h.padStart(2, "0");
      const formattedMinute = m.padStart(2, "0");
      const updatedTime = `${formattedHour}:${formattedMinute} ${mer}`;
      onTimeChange?.(updatedTime, type);
    }
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    if (input === "" || (/^\d{1,2}$/.test(input) && Number(input) >= 0 && Number(input) <= 12)) {
      hourDigitsEntered.current = input.length;
      setHour(input);
      updateParentTime(input, minute);

      if (input.length === 2) {
        setTimeout(() => {
          minuteInputRef.current?.focus();
        }, 10);
      }
    }
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMinute = e.target.value;
    if (
      newMinute === "" ||
      (/^\d{1,2}$/.test(newMinute) && Number(newMinute) >= 0 && Number(newMinute) < 60)
    ) {
      setMinute(newMinute);
      updateParentTime(hour, newMinute);
    }
  };

  const handleMeridiemChange = (newMeridiem: "AM" | "PM") => {
    setMeridiem(newMeridiem);
    updateParentTime(hour, minute, newMeridiem);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
    if (e.target === hourInputRef.current) {
      hourDigitsEntered.current = 0;
    }
  };

  const handleHourBlur = () => {
    const paddedHour =
      hour === ""
        ? String(new Date().getHours() % 12 || 12).padStart(2, "0")
        : hour.padStart(2, "0");
    setHour(paddedHour);
    updateParentTime(paddedHour, minute);
  };

  const handleMinuteBlur = () => {
    const paddedMinute = minute === "" ? "00" : minute.padStart(2, "0");
    setMinute(paddedMinute);
    updateParentTime(hour, paddedMinute);
  };

  const handleKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement>,
    inputType: "hour" | "minute",
  ) => {
    if ((e.key === "Enter" || e.key === "Tab") && inputType === "hour") {
      minuteInputRef.current?.focus();
      e.preventDefault();
    }
  };

  return (
    <TimePickerWrapper>
      <FlexDiv>
        <Input
          ref={hourInputRef}
          type="text"
          value={hour}
          onChange={handleHourChange}
          onBlur={handleHourBlur}
          onFocus={handleFocus}
          onKeyDown={(e) => handleKeyPress(e, "hour")}
          maxLength={2}
          placeholder="00"
        />
        <Colon>:</Colon>
        <Input
          ref={minuteInputRef}
          type="text"
          value={minute}
          onChange={handleMinuteChange}
          onBlur={handleMinuteBlur}
          onFocus={handleFocus}
          onKeyDown={(e) => handleKeyPress(e, "minute")}
          maxLength={2}
          placeholder="00"
        />
        <MeridiemContainer>
          <MeridiemBox onClick={() => handleMeridiemChange("AM")} isSelected={meridiem === "AM"}>
            AM
          </MeridiemBox>
          <MeridiemBox onClick={() => handleMeridiemChange("PM")} isSelected={meridiem === "PM"}>
            PM
          </MeridiemBox>
        </MeridiemContainer>
      </FlexDiv>
    </TimePickerWrapper>
  );
};

export default TimePicker;
