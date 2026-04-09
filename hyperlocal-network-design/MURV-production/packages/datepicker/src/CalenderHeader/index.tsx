import React from "react";
import { ChevronRight, ChevronLeft } from "@murv/icons";
import { IHeaderLabelText, INavigationButton, ISingleCalendarHeader } from "../types";
import SingleCalenderHeader, { SimpleTextLabel } from "./SingleCalender";
import { NavigationControls } from "./styles";
import { TODAY_DATE, getMonthAndYear } from "../utils";

export interface ComposeCalenderType {
  Single: typeof SingleCalenderHeader;
}

export const NavigationButtons = ({
  navigationAction,
  calenderType = "SINGLE",
  activeTableType = "DAY",
}: INavigationButton) => (
  <NavigationControls calenderType={calenderType} aria-live="polite">
    <div
      onClick={navigationAction}
      role="button"
      data-value="nav-left"
      aria-label={`Previous ${activeTableType}`}
      tabIndex={0}
      onKeyDown={navigationAction}
    >
      <ChevronLeft className="chevron-icon" />
    </div>
    <div
      onClick={navigationAction}
      role="button"
      data-value="nav-right"
      aria-label={`Next ${activeTableType}`}
      tabIndex={0}
      onKeyDown={navigationAction}
    >
      <ChevronRight className="chevron-icon" />
    </div>
  </NavigationControls>
);

const wrapCalenderHeader = <T extends Record<string, any>>(
  Componets: React.FC<T>[],
  {
    ...props
  }: {
    hideElementIndex: { [key: number]: boolean };
    componentProps?: Array<Object>;
    wrapperComponentProps?: Object;
  },
) => {
  const { hideElementIndex, componentProps = [] } = props;

  function wrapHeader(headerProps: T) {
    const { year, month } = getMonthAndYear(
      new Date(
        headerProps.year || TODAY_DATE.getFullYear(),
        parseInt(headerProps.month || `${TODAY_DATE.getMonth()}`, 10),
      ),
      "MMM",
    );
    return (
      <>
        {Componets.map((Component, ind) =>
          hideElementIndex[ind] ? null : (
            <Component
              {...{ ...props, ...componentProps[ind], ...headerProps }}
              year={year}
              month={month}
            />
          ),
        )}
      </>
    );
  }
  return wrapHeader;
};

export const SingleHeader = wrapCalenderHeader<ISingleCalendarHeader & INavigationButton>(
  [SingleCalenderHeader, NavigationButtons],
  {
    hideElementIndex: [],
  },
);

export const RangeSubHeader = ({
  hideElementIndex,
}: {
  hideElementIndex: { [key: number]: boolean };
}) =>
  wrapCalenderHeader<Partial<IHeaderLabelText> & INavigationButton>(
    [SimpleTextLabel, NavigationButtons],
    {
      hideElementIndex,
      componentProps: [{}, { calenderType: "RANGE" }],
    },
  );
