import {
  getWeeksInMonth,
  addMonths,
  endOfWeek,
  eachDayOfInterval,
  getYear,
  getMonth,
  eachWeekOfInterval,
  EachWeekOfIntervalOptions,
  subMonths,
  format,
  isValid,
  eachMonthOfInterval,
  eachYearOfInterval,
  subYears,
  addYears,
  isWithinInterval,
  isEqual,
  isSameMonth,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
} from "date-fns";
import {
  CalenderType,
  DateType,
  DynamicKeyObject,
  ICheckDateUtil,
  IConditionHandler,
  IDateProps,
  IDateRange,
  IObserver,
  ITableType,
  WeekStartsOn,
} from "./types";
import { GridType, keyMap } from "./constants";

export const TOTAL_MONTHS = 12;
export const TOTAL_WEEKS = 7;
export const TODAY_DATE = new Date();
export const CURRENT_TIME = new Date()
  .toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
  .replace(" ", "")
  .toUpperCase();
export const MONTH = 1;

export const generateMonthsInPairs = () => {
  const monthsInPairs = [];
  for (let i = 0; i < 12; i += 2) {
    monthsInPairs.push([
      new Date(TODAY_DATE.getFullYear(), i),
      new Date(TODAY_DATE.getFullYear(), i + 1),
    ]);
  }
  return monthsInPairs;
};

export const MONTHS_IN_PAIRS: Date[][] = generateMonthsInPairs();

export const getPairFromDate = (date: DateType) => {
  for (let i = 0; i < MONTHS_IN_PAIRS.length; i += 1) {
    const [firstMonthPair, secondMonthPair] = MONTHS_IN_PAIRS[i];
    if (
      date.getMonth() === firstMonthPair.getMonth() ||
      date.getMonth() === secondMonthPair.getMonth()
    ) {
      return Number(i);
    }
  }
  return -1;
};

export const getWeekDays = () => getWeeksInMonth(TODAY_DATE);

export const getMonthAndYear = (date: Date, formatType = "MMMM") => ({
  year: getYear(date),
  month: format(isValid(new Date(date)) ? date : TODAY_DATE, formatType),
});

const getBaseDate = ({
  startMonth,
  endMonth,
  year,
}: {
  startMonth: number;
  endMonth: number;
  year: number;
}) => {
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, endMonth, 0);
  const baseDates = { startDate, endDate };
  return { ...baseDates };
};

export function dateHelper(f: (...rest: any[]) => Date[]) {
  return <T>({ startDate, endDate }: { startDate: Date; endDate: Date }, options: T) =>
    f({ start: startDate, end: endDate }, options);
}

export const getWeeksFromMonth = ({
  startMonth,
  endMonth,
  year,
  weekStartsOn = 1,
}: {
  startMonth: number;
  endMonth: number;
  year: number;
  weekStartsOn?: WeekStartsOn;
}) =>
  dateHelper(eachWeekOfInterval)<EachWeekOfIntervalOptions>(
    getBaseDate({ startMonth, endMonth, year }),
    {
      weekStartsOn,
    },
  );

export const isWeekOfSameMonth = (
  date: DateType,
  month: number,
  weekStartsOn: WeekStartsOn = 1,
) => {
  const days = eachDayOfInterval({ start: date, end: endOfWeek(date, { weekStartsOn }) });
  let boolean = false;
  days.forEach((day) => {
    if (day.getMonth() === month) {
      boolean = true;
    }
  });
  return boolean;
};

export const getDaysFromMonth = (
  date: Date,
  type: CalenderType,
  weekStartsOn: WeekStartsOn = 1,
) => {
  let startMonth = 0;
  let endMonth = 1;
  const [year, month] = [getYear(date), getMonth(date)];

  if (type === "RANGE") {
    const i = getPairFromDate(date);
    const [start, end] = MONTHS_IN_PAIRS[i];
    startMonth = start.getMonth();
    endMonth = end.getMonth() + 1;

    const weeksInMonth = getWeeksFromMonth({ startMonth, endMonth, year, weekStartsOn });

    const result = weeksInMonth.reduce(
      (prev: Date[][], curr: Date) => {
        if (isWeekOfSameMonth(curr, startMonth, weekStartsOn)) {
          prev[0].push(curr);
        }
        if (isWeekOfSameMonth(curr, endMonth - 1, weekStartsOn)) {
          prev[1].push(curr);
        }
        return prev;
      },
      [[], []],
    );

    const mixDays = result.map((weeks) =>
      weeks.map((week) =>
        eachDayOfInterval({ start: week, end: endOfWeek(week, { weekStartsOn }) }),
      ),
    );
    return {
      days: mixDays,
      startMonth,
      endMonth,
      year,
    };
  }
  startMonth = month;
  endMonth = month + 1;

  const weeksInMonth = getWeeksFromMonth({ startMonth, endMonth, year, weekStartsOn });
  const mixDays = weeksInMonth.map((week) =>
    eachDayOfInterval({ start: week, end: endOfWeek(week, { weekStartsOn }) }),
  );
  return { days: [mixDays], startMonth, endMonth, year };
};

/**
 * Navigation Action Chaining Helper for Navigating between Days / Months & Years
 */

export const navigatiorAction = {
  date: TODAY_DATE,
  navigationData: {
    year: {},
    month: {},
  },
  /**
   * Sets the Navigation Map With Key as type Day | Month | Year & value as Days/Months/Years to Forward or Backward list
   * @param {Date} date
   * @param {Object} {navigation}
   * @returns {Object} this
   */
  setNavigationData(
    navigation: {
      year: DynamicKeyObject<number>;
      month: DynamicKeyObject<number>;
      day: DynamicKeyObject<number>;
    },
    date: DateType,
  ) {
    this.date = isValid(new Date(date)) ? new Date(date) : TODAY_DATE;
    this.navigationData = { ...navigation };
    return this;
  },
  days() {
    const keyVal = Object.keys(this.navigationData.day)[0];
    if (Object.keys(this.navigationData.day).length) {
      this.date =
        keyVal === "prev"
          ? subMonths(this.date, this.navigationData.day[keyVal])
          : addMonths(this.date, this.navigationData.day[keyVal]);
    }
    return this;
  },
  years() {
    if (
      Object.keys(this.navigationData.year).length ||
      Object.keys(this.navigationData.month).length
    ) {
      const keyVal = Object.keys(this.navigationData.year).length
        ? Object.keys(this.navigationData.year)[0]
        : Object.keys(this.navigationData.month)[0];
      const amount = Object.keys(this.navigationData.year).length
        ? 15
        : this.navigationData.month[keyVal];
      this.date = keyVal === "prev" ? subYears(this.date, amount) : addYears(this.date, amount);
    }

    return this;
  },
};

export const getWeekKey = (ind: number) => {
  const weekMap = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  return weekMap[ind];
};

/**
 * Returns the Months list
 * @param {Date} date
 * @param {CalenderType} type
 * @returns {Object} { quarters, year }
 */

export const getMonthByQuarter = (date: DateType, calenderType: CalenderType) => {
  const startDate = new Date(date.getFullYear(), 0, 1);
  const endDate = new Date(date.getFullYear() + 1, 0, 1);
  const year = [
    date.getFullYear(),
    new Date(date.getFullYear() + 1, date.getMonth()).getFullYear(),
  ];

  const getQuarter = (currDate: DateType) => {
    const quarters = eachMonthOfInterval(
      {
        start: new Date(currDate.getFullYear(), 0, 1),
        end: new Date(currDate.getFullYear(), 11, 31),
      },
      { step: 3 },
    ).map((quarter) =>
      eachMonthOfInterval(
        {
          start: quarter,
          end: new Date(quarter.getFullYear(), quarter.getMonth() + 2),
        },
        { step: 1 },
      ),
    );
    return quarters;
  };
  if (calenderType === "RANGE") {
    return { quarters: [getQuarter(startDate), getQuarter(endDate)], year };
  }
  return { quarters: [getQuarter(startDate)], year: [year[0]] };
};

/**
 * Returns the years list
 * @param {Date} date
 * @param {CalenderType} type
 * @returns {Object} { years, fromToYears }
 */

export const getYearsList = (date: DateType, type: CalenderType) => {
  const yearGap = 15;
  const years = [];
  const fromToYears: number[][] = [];
  let startDate = new Date(date.getFullYear(), 0, 1);
  let endDate = new Date(date.getFullYear() + yearGap, 0, 1);
  fromToYears.push([startDate.getFullYear(), endDate.getFullYear()]);
  years.push(
    eachYearOfInterval({
      start: startDate,
      end: endDate,
    }),
  );
  if (type === "RANGE") {
    startDate = new Date(endDate.getFullYear() + 1, 0, 1);
    endDate = new Date(endDate.getFullYear() + yearGap + 1, 0, 1);
    fromToYears.push([startDate.getFullYear(), endDate.getFullYear()]);
    years.push(
      eachYearOfInterval({
        start: startDate,
        end: endDate,
      }),
    );
  }

  return { years, fromToYears };
};

/**
 * Returns the boolean to check if date is selected or not [For Single Date Picker]
 * @param {Date} currentSelectedMonth
 * @param {Date} selectedDate
 * @param {Date} day
 * @returns {boolean} true/false
 */

export const isDateSelected = ({
  currentSelectedMonth,
  day,
  selectedDate,
}: {
  selectedDate: DateType;
  currentSelectedMonth: DateType;
  day: DateType;
}) => isSameMonth(currentSelectedMonth, day) && isEqual(selectedDate.getDate(), day.getDate());

/*

Utility function for checking the disabled dates in calender

*/

export function checkDisableDay(
  this: ICheckDateUtil,
  startDate: DateType,
  endDate: DateType,
  calenderType?: CalenderType,
) {
  this.startDate = startDate;
  this.endDate = endDate;
  this.calenderType = calenderType;

  /*
  This method is used to check date if it is in same month as startDate and endDate
  */

  this.isWithInSameMonthRange = (date: DateType, index: number) => {
    if (this.startDate && this.endDate && this.calenderType) {
      const checkByIndex =
        index === 0
          ? date.getMonth() === this.startDate.getMonth()
          : date.getMonth() === this.endDate.getMonth();

      return checkByIndex;
    }
    return false;
  };

  /*
  This method is used to check date if it is in same month with specified range such as startDate and endDate after range is selected
  */

  this.isMonthsWithInRange = (month: DateType) => {
    if (this.startDate && this.endDate) {
      const [leftDate, rightDate] = [
        new Date(this.startDate.getFullYear(), this.startDate.getMonth(), 1),
        new Date(month.getFullYear(), month.getMonth(), 1),
      ];
      return (
        isEqual(leftDate, rightDate) ||
        isWithinInterval(month, { start: this.startDate, end: this.endDate })
      );
    }
    return false;
  };

  /*
  This method is used to check date if it is in same month as startDate and hover Date
  */

  this.isHoverMonthsWithInRange = (month: DateType) => {
    if (this.startDate && this.endDate) {
      return isWithinInterval(month, { start: this.startDate, end: this.endDate });
    }
    return false;
  };

  /*
  This method is used to check date if it is in same range as startDate and endDate
  */

  this.isWithInRange = (date: DateType) => {
    if (this.startDate && this.endDate) {
      return isWithinInterval(date, { start: this.startDate, end: this.endDate });
    }
    return false;
  };

  /*
  This method is used to check date if it is in same date as startDate and endDate
  */

  this.checkRangeInterval = (date: DateType) => {
    if (this.startDate && this.endDate) {
      if (isEqual(date, this.startDate) || isEqual(date, this.endDate)) {
        return false;
      }
    }
    return true;
  };

  this.isWithInSameSize = (date: DateType, gridType: ITableType, maxDateRange?: number) => {
    if (!maxDateRange || maxDateRange <= 0) {
      return true;
    }
    if (this.startDate && date) {
      const isDifferenceValid =
        (func: (dateLeft: Date, date: Date) => number) => (maxRange: number) =>
          Math.abs(func(this.startDate as Date, date)) < maxRange;

      const utilityList = [differenceInDays, differenceInMonths, differenceInYears];

      return isDifferenceValid(utilityList[GridType.indexOf(gridType)])(maxDateRange);
    }
    return false;
  };

  this.isWithInPartialRange = (date: DateType) => {
    if (this.startDate && this.endDate) {
      return isWithinInterval(date, { start: this.startDate, end: this.endDate });
    }
    if (this.startDate && !this.endDate) {
      return date >= this.startDate;
    }
    if (!this.startDate && this.endDate) {
      return date <= this.endDate;
    }
    return true;
  };
}

/*

Observer implementation for listening for subscribed functions and notify subscribers about date/month/year changes

*/

export function OnChangeObserver(this: IObserver) {
  this.observers = [];
  this.subscribe = (func: Function) => {
    this.observers.push(func);
    return this;
  };
  this.subscribe = (func: Function[]) => {
    this.observers = [...this.observers, ...func];
    return this;
  };
  this.unsubscribe = (func: Function) => {
    this.observers = this.observers.filter((observer) => observer !== func);
    return this;
  };
  this.notifyObservers = <T>(data: T[]) => {
    this.observers.forEach((observer, ind) => observer(data[ind]));
    return this;
  };

  this.notifyAndGetData = <T, U>(...args: T[]) =>
    this.observers.map((observer) => observer(...args)) as Array<U>;

  this.notifyAndGetData = <T, U>(...args: T[]) => {
    const [index, ...restArgs] = args;
    return this.observers[index as number](...restArgs) as U;
  };
}

/*

utility for setting calender offset range recieved from Props

*/
export function DataFromProps(this: IDateProps, dateRange: IDateRange | null) {
  this.dateRange = dateRange;
  this.monthRange = dateRange;
  this.yearRange = dateRange;
  this.activeDate = null;

  this.getRange = (gridType: ITableType) => {
    const dateKey = keyMap[gridType].start as keyof IDateRange;
    this.activeDate = this.dateRange ? this.dateRange[dateKey] : TODAY_DATE;
    return this.activeDate || TODAY_DATE;
  };
}

export const formatDateFromInput = (date: DateType | number | string) => {
  if (!isValid(new Date(date))) {
    return null;
  }

  switch (typeof date) {
    case "number":
      return new Date(date * 1000);
    default:
      return new Date(date);
  }
};

export function ConditionHandler(
  this: IConditionHandler,
  conditions: Array<{ callBack: () => boolean; expected: boolean }>,
) {
  this.conditions = conditions.filter((cond) => typeof cond.callBack === "function");
  this.isAnyConditionValid = (date: DateType) =>
    this.conditions.some((condition) => {
      if (condition.callBack) {
        return condition.callBack(date) === condition.expected;
      }
      return false;
    });

  this.allConditionsValid = (date: DateType) => {
    if (this.conditions.length === 0) {
      return false;
    }
    return this.conditions.every((condition) => {
      if (condition.callBack) {
        return condition.callBack(date) === condition.expected;
      }
      return false;
    });
  };
}
