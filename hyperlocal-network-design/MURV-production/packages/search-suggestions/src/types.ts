import React from "react";

/*
 * Interface describing the props for <SearchSuggestions />
 * Since this is a interface, it can be further expanded by user
 */
type ISearchOption = {
  text: string;
  value?: string;
};

export type ISearchSuggestionsElement = {
  SearchSuggestion: React.FC;
};

export type ISearchSuggestionsOutput = {
  selectedSuggestion: string | null;
  closedOption: string | null;
};

export interface ISearchSuggestionsProps {
  id: string;
  dataTestId: string;
  options: Array<ISearchOption>;
  optionsType: "history" | "suggest";
  ariaLabel?: string;
  searchText?: string;
  width?: string;
}

export interface ISearchSuggestionsStyleProps {
  isHistory: boolean;
  width?: string;
}

export interface ISearchOptionProps {
  onClick: () => void;
}

export interface IRootProps {
  id: string;
  dataTestId: string;
  options: Array<ISearchOption>;
  optionsType: "history" | "suggest";
  ariaLabel: string;
  listRef: React.RefObject<HTMLUListElement>;
  optionClickHandler: (option: string) => void;
  optionCloseHandler: (option: string) => void;
  handleKeyDown: (event: React.KeyboardEvent<HTMLDivElement>, currentIndex: number) => void;
  searchText?: string;
  width?: string;
}
