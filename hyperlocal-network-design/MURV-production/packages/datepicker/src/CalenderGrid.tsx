import React, { KeyboardEvent, MouseEvent, MouseEventHandler, useState } from "react";
import {
  DataFromProps,
  getDaysFromMonth,
  getMonthByQuarter,
  getYearsList,
  navigatiorAction,
  OnChangeObserver,
  TODAY_DATE,
} from "./utils";
import {
  MonthGridContainer,
  TableHead,
  TableBody,
  TableData,
  TableRow,
  SubGridContainer,
  TimePickerContainer,
} from "./styles";
import CalenderDay from "./CalenderDay";
import Week from "./Week";
import { RangeSubHeader, SingleHeader } from "./CalenderHeader";
import {
  IMonthGridProps,
  DynamicKeyObject,
  ITableType,
  DateType,
  CalenderType,
  SimpleCalenderType,
  IDateProps,
  IObserver,
  IMonthGridHeader,
  ICurrentGridState,
  IGridTable,
  MaxRange,
  WeekStartsOn,
} from "./types";
import CalenderMonth from "./CalenderMonth";
import CalenderYear from "./CalenderYear";
import useDateRange from "./hooks/useDateRange";
import { gridConfig } from "./constants";
import Footer from "./Footer";
import CalenderRangeOption from "./CalenderRangeOption";
import TimePicker from "./TimePicker";

const GridTableHeader = ({
  gridTableType,
  calenderType,
  currentGridData,
  ind,
  handleNavigation,
  weekStartsOn,
}: {
  gridTableType: ITableType;
  calenderType: CalenderType;
  currentGridData: ICurrentGridState;
  ind: number;
  handleNavigation: (e: React.MouseEvent | React.KeyboardEvent) => void;
  weekStartsOn?: WeekStartsOn;
}) => {
  switch (gridTableType) {
    case "DAY":
      return (
        <TableHead itemCount={1}>
          {calenderType === "RANGE" ? (
            <TableRow columns={1}>
              {RangeSubHeader({ hideElementIndex: ind === 0 ? { 1: true } : {} })({
                month: `${
                  ind === 0
                    ? currentGridData.currentDaysData.startMonth
                    : currentGridData.currentDaysData.endMonth - 1
                }`,
                year: currentGridData.currentDaysData.year,
                navigationAction: handleNavigation,
                textLabels: [],
                interfix: "",
              })}
            </TableRow>
          ) : null}
          <Week weekStartsOn={weekStartsOn} />
        </TableHead>
      );
    case "MONTH":
      return (
        <TableHead itemCount={1}>
          <TableRow columns={1}>
            {RangeSubHeader({ hideElementIndex: ind === 0 ? { 1: true } : {} })({
              navigationAction: handleNavigation,
              textLabels: [currentGridData.currentMonthsData.year[ind]],
              interfix: "",
            })}
          </TableRow>
        </TableHead>
      );
    case "YEAR":
      return (
        <TableHead itemCount={1}>
          <TableRow columns={1}>
            {RangeSubHeader({ hideElementIndex: ind === 0 ? { 1: true } : {} })({
              navigationAction: handleNavigation,
              textLabels: currentGridData.currentYearsData.fromToYears[ind],
              interfix: "-",
            })}
          </TableRow>
        </TableHead>
      );
    default:
      return null;
  }
};

const GridBody = ({
  gridTableType,
  currentGrid,
  calenderType,
  handleDateSelect,
  maxRange,
  selectedDate,
  onDateClick,
  dateRangeValue,
  handleDateOver,
  data,
  index,
  rootIndex,
  minDate,
  maxDate,
  isDayDisabled,
  isMonthDisabled,
  isYearDisabled,
  weekStartsOn,
}: {
  data: any[];
  index: number;
  rootIndex: number;
} & IGridTable) => {
  const { currentGridData, setCurrentGridData } = currentGrid;
  switch (gridTableType) {
    case "DAY":
      return (
        <CalenderDay
          currentSelectedMonth={currentGridData.activeDate}
          selectedDate={selectedDate}
          calenderType={calenderType}
          onClick={(e: React.MouseEvent) => {
            const date = new Date(e.currentTarget.getAttribute("data-date-value") || TODAY_DATE);

            if (calenderType === "RANGE") {
              handleDateSelect(e, date, "DAY");
              return;
            }
            if (onDateClick) {
              onDateClick(e);
            }
            setCurrentGridData({
              ...currentGridData,
              activeDate: date,
              activeTableType: "DAY",
            });
          }}
          days={[...data]}
          months={[
            currentGridData.currentDaysData.startMonth,
            currentGridData.currentDaysData.endMonth,
          ]}
          weekIndex={index}
          rootIndex={rootIndex}
          dateRange={dateRangeValue}
          handleMouseUp={() => {}}
          handleMouseOver={handleDateOver}
          maxDays={maxRange?.days}
          min={minDate}
          max={maxDate}
          isDayDisabled={isDayDisabled}
        />
      );
    case "MONTH":
      return (
        <CalenderMonth
          monthRange={dateRangeValue}
          quarterIndex={index}
          months={data}
          activeDate={currentGridData.activeDate}
          handleMouseOver={handleDateOver}
          calenderType={calenderType}
          onClick={(e, month) => {
            const newDate = new Date(
              currentGridData.activeDate.getFullYear(),
              month.getMonth(),
              currentGridData.activeDate.getDay(),
            );
            if (calenderType === "RANGE") {
              handleDateSelect(e, month, "MONTH");
              return;
            }
            setCurrentGridData({
              ...currentGridData,
              activeDate: newDate,
              activeTableType: "DAY",
              currentDaysData: getDaysFromMonth(newDate, calenderType, weekStartsOn),
            });
          }}
          maxMonths={maxRange?.months}
          min={minDate}
          max={maxDate}
          isMonthDisabled={isMonthDisabled}
        />
      );
    case "YEAR":
      return (
        <CalenderYear
          years={data}
          calenderType={calenderType}
          activeYear={currentGridData.activeDate.getFullYear()}
          handleMouseOver={handleDateOver}
          yearRange={dateRangeValue}
          onClick={(e, year) => {
            const newDate = new Date(
              year.getFullYear(),
              currentGridData.activeDate.getMonth(),
              currentGridData.activeDate.getDay(),
            );
            if (calenderType === "RANGE") {
              handleDateSelect(e, year, "YEAR");
              return;
            }
            setCurrentGridData({
              ...currentGridData,
              activeDate: newDate,
              activeTableType: "DAY",
              currentDaysData: getDaysFromMonth(newDate, calenderType, weekStartsOn),
            });
          }}
          maxYears={maxRange?.years}
          min={minDate}
          max={maxDate}
          isYearDisabled={isYearDisabled}
        />
      );
    default:
      return null;
  }
};

function RangeTableTemplate<T>({
  list = [],
  onTimeChange,
  startTime,
  endTime,
  calenderType,
  timeValue,
  weekStartsOn,
  ...props
}: {
  list: T[];
  calenderType: CalenderType;
} & IGridTable) {
  return (
    <TableRow columns={1}>
      <TableData colSpan={calenderType === "SINGLE" ? 1 : 2}>
        {list.map((item: any, ind: number) => (
          <SubGridContainer role="grid" aria-labelledby={`Calender Grid No ${ind}`}>
            <GridTableHeader
              calenderType={calenderType}
              gridTableType={props.gridTableType}
              handleNavigation={props.handleNavigation}
              currentGridData={props.currentGrid.currentGridData}
              ind={ind}
              weekStartsOn={weekStartsOn}
            />
            <TableBody>
              {props.gridTableType !== "YEAR" ? (
                item.map((subItem: any, subIndex: number) => (
                  <GridBody
                    calenderType={calenderType}
                    data={subItem}
                    index={subIndex}
                    rootIndex={ind}
                    {...props}
                  />
                ))
              ) : (
                <GridBody
                  calenderType={calenderType}
                  data={item}
                  index={ind}
                  rootIndex={ind}
                  {...props}
                />
              )}
            </TableBody>
            {onTimeChange && (
              <TimePickerContainer>
                <TimePicker
                  startTime={startTime}
                  endTime={endTime}
                  onTimeChange={(time) => {
                    onTimeChange(time, ind === 0 ? "start" : "end");
                  }}
                  timeValue={timeValue}
                  type={ind === 0 ? "start" : "end"}
                />
              </TimePickerContainer>
            )}
          </SubGridContainer>
        ))}
      </TableData>
    </TableRow>
  );
}

const GridTableBody = ({
  onTimeChange,
  gridTableType,
  currentGrid,
  calenderType,
  startTime,
  endTime,
  weekStartsOn,
  ...props
}: IGridTable) => {
  const { currentGridData } = currentGrid;
  switch (gridTableType) {
    case "DAY":
      return (
        <RangeTableTemplate
          list={currentGridData.currentDaysData.days}
          {...{
            ...props,
            gridTableType,
            currentGrid,
            calenderType,
            onTimeChange,
            startTime,
            endTime,
            weekStartsOn,
          }}
        />
      );
    case "MONTH":
      return (
        <RangeTableTemplate
          list={currentGridData.currentMonthsData.quarters}
          {...{ ...props, gridTableType, currentGrid, calenderType, weekStartsOn }}
        />
      );
    case "YEAR":
      return (
        <RangeTableTemplate
          list={currentGridData.currentYearsData.years}
          {...{ ...props, gridTableType, currentGrid, calenderType, weekStartsOn }}
        />
      );
    default:
      return null;
  }
};

const MonthGridWrapper = (HeaderComponent?: React.FC<IMonthGridHeader> | JSX.Element) => {
  const MonthGrid = ({
    onDateClick,
    selectedDate = TODAY_DATE,
    calenderType = "RANGE",
    onDateChange,
    onMonthChange,
    onYearChange,
    type = "SIMPLE",
    onDone,
    onCancel,
    activeCalenderType = "DAY",
    header,
    minDate,
    maxDate,
    dateRangeOptions,
    onTimeChange,
    startTime,
    endTime,
    timeValue,
    weekStartsOn = 1,
    ...props
  }: Partial<IMonthGridProps>) => {
    const calenderDataObserver = new (OnChangeObserver as any)() as IObserver;

    calenderDataObserver.subscribe([getDaysFromMonth, getMonthByQuarter, getYearsList]);

    const { dateRange, maxRange } = props;

    const rangeOfProps = new (DataFromProps as any)(dateRange) as IDateProps;

    const getActiveList = (tableType: ITableType, date: DateType) => {
      const index = Object.keys(gridConfig).indexOf(tableType);

      let activeDate = rangeOfProps.getRange(tableType);

      if (calenderType === "SINGLE") {
        activeDate = date;
      }

      const activeListData = calenderDataObserver.notifyAndGetData<
        [number, DateType, CalenderType, WeekStartsOn],
        DateType[][][] | DateType[][]
      >(index, activeDate || TODAY_DATE, calenderType, weekStartsOn);

      return { activeDate, [gridConfig[tableType].stateKey]: activeListData };
    };

    const [currentGridData, setCurrentGridData] = useState<ICurrentGridState>({
      currentYearsData: {
        years: [],
        fromToYears: [],
      },
      currentMonthsData: {
        quarters: [],
        year: [],
      },
      currentDaysData: {
        days: [],
        startMonth: 0,
        endMonth: 1,
        year: TODAY_DATE.getFullYear(),
      },
      activeTableType: activeCalenderType,
      ...getActiveList(activeCalenderType, TODAY_DATE),
    });

    const [{ dateRangeValue }, { handleDateSelect, handleDateOver, handleRangeSelect }] =
      useDateRange({
        activeCalendar: currentGridData.activeTableType,
        onDateChange,
        dateRange,
        dateFormat: props.dateOutputFormat || { formatStr: "" },
      });

    const handleFooterClick = (e: MouseEvent<HTMLButtonElement> | KeyboardEvent) => {
      const btn = (e.target as HTMLDivElement).closest("button");
      if (!btn) return;
      const buttonKeyBoardEvent = e as KeyboardEvent;
      if (buttonKeyBoardEvent.key && buttonKeyBoardEvent.key !== "Enter") {
        return;
      }

      if (btn.type === "submit" && onDone) {
        onDone({
          dateRange: dateRangeValue,
          activeDate: currentGridData.activeDate,
        });
        return;
      }
      if (btn.type === "reset" && onCancel) {
        onCancel();
      }
    };

    const handleNavigation = (e: MouseEvent | KeyboardEvent) => {
      const id = e.currentTarget.getAttribute("data-value");

      // allowing only enter key for keyboard navigation
      if ((e as KeyboardEvent).key && (e as KeyboardEvent).key !== "Enter") {
        return;
      }

      if (!id) {
        return;
      }
      const map: DynamicKeyObject<string | number> = {
        "nav-left": "prev",
        "nav-right": "next",
        DAY: "day",
        MONTH: "month",
        YEAR: "year",
        SINGLE: 1,
        RANGE: 2,
      };
      const keyVal = map[id];
      const currKey = map[currentGridData.activeTableType] as "month" | "year" | "day";
      const initialNavigation = {
        month: {},
        year: {},
        day: {},
      };
      const stateValue = {
        navigation: {
          ...initialNavigation,
          [currKey]: { [keyVal]: map[calenderType] },
        },
      };
      navigatiorAction
        .setNavigationData(stateValue.navigation, currentGridData.activeDate)
        .days()
        .years();

      const index = Object.keys(gridConfig).indexOf(currentGridData.activeTableType);

      setCurrentGridData({
        ...currentGridData,
        activeDate: navigatiorAction.date,
        [gridConfig[currentGridData.activeTableType].stateKey]:
          calenderDataObserver.notifyAndGetData<
            [number, DateType, CalenderType, WeekStartsOn],
            DateType[][][] | DateType[][]
          >(index, navigatiorAction.date, calenderType, weekStartsOn),
      });
    };

    return (
      <MonthGridContainer
        role="dialog"
        aria-roledescription="Dialog Showing List of Available Dates"
        aria-modal="true"
        aria-label={`Calender for ${currentGridData.activeTableType}`}
      >
        {HeaderComponent ? (
          <TableHead itemCount={1}>
            <TableRow columns={calenderType === "SINGLE" ? 2 : 1}>
              {calenderType === "SINGLE" && typeof HeaderComponent === "function" && (
                <HeaderComponent
                  navigationAction={handleNavigation}
                  subType={type}
                  year={currentGridData.activeDate.getFullYear()}
                  month={`${currentGridData.activeDate.getMonth()}`}
                  activeTableType={currentGridData.activeTableType}
                  handleHeaderCallback={(tableType: ITableType) => {
                    setCurrentGridData({
                      ...currentGridData,
                      activeTableType: tableType,
                      ...getActiveList(tableType, currentGridData.activeDate),
                    });
                  }}
                  calenderType={calenderType}
                />
              )}
              {calenderType === "RANGE" && HeaderComponent}
            </TableRow>
          </TableHead>
        ) : null}
        {dateRangeOptions && (
          <CalenderRangeOption
            dateRangeOptions={dateRangeOptions}
            handleRangeSelect={handleRangeSelect}
            dateRangeValue={dateRangeValue}
          />
        )}
        <TableBody>
          <GridTableBody
            gridTableType={currentGridData.activeTableType}
            currentGrid={{ currentGridData, setCurrentGridData }}
            calenderType={calenderType}
            handleNavigation={handleNavigation}
            handleDateOver={handleDateOver}
            handleDateSelect={handleDateSelect}
            maxRange={maxRange as MaxRange}
            dateRangeValue={dateRangeValue}
            selectedDate={selectedDate}
            onDateClick={onDateClick as MouseEventHandler}
            minDate={minDate}
            maxDate={maxDate}
            onTimeChange={onTimeChange}
            startTime={startTime}
            endTime={endTime}
            timeValue={timeValue}
            weekStartsOn={weekStartsOn}
            {...props}
          />
        </TableBody>
        <Footer onFooterClick={handleFooterClick} onCancel={onCancel} onDone={onDone} />
      </MonthGridContainer>
    );
  };
  return MonthGrid;
};

export const SingleGrid = MonthGridWrapper(SingleHeader);

export const SingleMonthGrid = ({
  type,
  ...props
}: Omit<IMonthGridProps, "calenderType"> & { type: SimpleCalenderType }) => (
  <SingleGrid {...props} calenderType="SINGLE" type={type} />
);

export const RangeMonthGrid = ({
  header,
  ...props
}: Omit<IMonthGridProps, "calenderType" | "type" | "selectedDate" | "onDateClick">) =>
  MonthGridWrapper(header)({ ...props, calenderType: "RANGE" });
