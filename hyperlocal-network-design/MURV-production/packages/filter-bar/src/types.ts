import { MultiSelectProps } from "@murv/multi-select";
import { SingleSelectProps } from "@murv/single-select";
import { SingleDateSelectProps } from "@murv/single-date-select";
import { RangeDateSelectProps } from "@murv/range-date-select";
import { IInputWithLabelProps } from "@murv/input";

export interface MultiSelectFilterProps
  extends Omit<MultiSelectProps, "onSelect" | "selected" | "name" | "id"> {}

export interface SingleSelectFilterProps
  extends Omit<
    SingleSelectProps,
    | "value"
    | "onChange"
    | "orientation"
    | "withBorder"
    | "renderButtonIcon"
    | "name"
    | "id"
    | "label"
  > {}

export interface SingleDateSelectFilterProps
  extends Omit<
    SingleDateSelectProps,
    "onDateChange" | "date" | "label" | "orientation" | "withBorder" | "renderButtonIcon"
  > {}

export interface RangeDateSelectFilterProps
  extends Omit<
    RangeDateSelectProps,
    "onDateChange" | "dateRange" | "label" | "orientation" | "withBorder" | "renderButtonIcon"
  > {}

export interface TextFilterProps
  extends Omit<
    IInputWithLabelProps,
    | "value"
    | "onChange"
    | "type"
    | "deviceOrientation"
    | "count"
    | "actionIcon"
    | "prefixIcon"
    | "suffixIcon"
    | "tabIndex"
    | "compact"
    | "onKeyDown"
    | "autoFocus"
    | "inputRef"
  > {}

export type FilterType =
  | "single-select"
  | "multi-select"
  | "single-date-select"
  | "range-date-select"
  | "text-filter"
  | "custom-dropdown";
export type FilterConfig = {
  filterLabel: string;
  filterId: string;
  filterType: FilterType;
  filterProps:
    | MultiSelectFilterProps
    | SingleSelectFilterProps
    | SingleDateSelectFilterProps
    | RangeDateSelectFilterProps
    | TextFilterProps;
};

export type FilterBarProps = {
  filterConfig: FilterConfig[];
  filters?: IFilterState;
  onFilterChange?: (filters: IFilterState) => void;
  onFilterApply?: (filters: IFilterState) => void;
  enableApplyResetButtons?: boolean;
  resetSelectedFilterState?: (resetHandler: () => void) => void;
};

export type FilterRendererProps = {
  filterConfig: FilterConfig[];
  filterState: Record<string, string | string[] | [string, string] | IDateRangeState>;
  onChange: (id: string, value: string | string[] | [string, string] | IDateRangeState) => void;
  inline?: boolean;
  last?: boolean;
};

export type IDateRangeState = { startDate: Date | string; endDate: Date | string };

export type IFilterState = Record<string, string | string[] | IDateRangeState>;

export type SelectRenderProps = {
  config: FilterConfig;
  filterState: IFilterState;
  onChange: (id: string, value: string | string[] | [string, string] | IDateRangeState) => void;
  inline?: boolean;
  last?: boolean;
};

interface CustomDropdownConfig {
  filterType: "custom-dropdown";
  children?: React.ReactNode;
  filterId: string;
  filterLabel: string;
  filterProps?: {
    disabled?: boolean;
    showBadge?: boolean;
    isInteractive?: boolean;
  };
}

export type CustomDropdownRenderProps = {
  config: CustomDropdownConfig;
  filterState: IFilterState;
  onChange: (id: string, value: string | string[] | [string, string] | IDateRangeState) => void;
  inline?: boolean;
  last?: boolean;
};
