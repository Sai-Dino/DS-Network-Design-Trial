import { ITableType } from "./types";

export const GridType = ["DAY", "MONTH", "YEAR"];

export const keyMap: { [key in ITableType]: { [key: string]: string } } = {
  DAY: {
    start: "startDate",
    end: "endDate",
    hover: "hoverSelectedDate",
  },
  MONTH: {
    start: "startMonth",
    end: "endMonth",
    hover: "hoverSelectedMonth",
  },
  YEAR: {
    start: "startYear",
    end: "endYear",
    hover: "hoverSelectedYear",
  },
};

export const gridConfig = {
  DAY: {
    stateKey: "currentDaysData",
  },
  MONTH: {
    stateKey: "currentMonthsData",
  },
  YEAR: {
    stateKey: "currentYearsData",
  },
};
