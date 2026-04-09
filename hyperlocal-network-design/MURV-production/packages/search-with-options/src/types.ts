import { ISearchProps } from "@murv/search";

export enum TYPES {
  static = "static",
  standard = "standard",
}
export interface ISearchValue {
  searchValue?: string;
  selectedOption?: string;
}

export interface IOption {
  label: string;
  value: string;
}
export interface ISearchWithOptionsProps {
  searchComponentProps: Omit<ISearchProps, "onReset" | "onSearch" | "onChange">;
  value?: ISearchValue;
  onSearch: (value: ISearchValue) => void;
  onChange?: (value: ISearchValue) => void;
  onReset?: (value: ISearchValue) => void;
  width?: string;
  testId?: string;
  orientation: "static" | "standard";
  options: IOption[];
}

export interface IRootProps {
  options: IOption[];
  searchValue: string;
  showSearchValueInVertical?: boolean;
  optionClickHandler: (value: string) => void;
}