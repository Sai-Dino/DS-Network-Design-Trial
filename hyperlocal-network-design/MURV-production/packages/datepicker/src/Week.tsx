import React from "react";
import { TableHeadData, TableRow } from "./styles";
import { getWeekKey } from "./utils";
import { WeekStartsOn } from "./types";

// Full week days starting from Sunday (index 0)
const WEEK_DAYS = ["S", "M", "T", "W", "T", "F", "S"];

interface WeekProps {
  weekStartsOn?: WeekStartsOn;
}

const Week = ({ weekStartsOn = 1 }: WeekProps) => {
  // Reorder week days based on weekStartsOn
  const getOrderedWeekDays = () => {
    const orderedDays = [];
    for (let i = 0; i < 7; i += 1) {
      orderedDays.push(WEEK_DAYS[(weekStartsOn + i) % 7]);
    }
    return orderedDays;
  };

  const orderedWeeks = getOrderedWeekDays();

  return (
    <TableRow>
      {orderedWeeks.map((week, ind) => (
        <TableHeadData key={getWeekKey(ind)} id={week}>
          {week}
        </TableHeadData>
      ))}
    </TableRow>
  );
};

export default Week;
