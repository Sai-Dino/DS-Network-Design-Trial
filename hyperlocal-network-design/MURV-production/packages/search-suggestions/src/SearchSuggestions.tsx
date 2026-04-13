import React, { useRef, useState } from "react";
import { CloseSmall, History, Search } from "@murv/icons";
import {
  IRootProps,
  ISearchSuggestionsElement,
  ISearchSuggestionsOutput,
  ISearchSuggestionsProps,
} from "./types";
import {
  CloseIconWrapper,
  SearchOption,
  SearchText,
  StyledListItem,
  StyledUnorderedList,
  SearchValue
} from "./styles";

const Root = ({
  id,
  dataTestId,
  ariaLabel,
  options,
  optionsType,
  listRef,
  searchText,  
  width,
  optionClickHandler,
  optionCloseHandler,
  handleKeyDown,
}: IRootProps) => {
  const isHistory = optionsType === "history";
  const OptionIcon = isHistory ? History : Search;
  return (
    <StyledUnorderedList
      ref={listRef}
      id={id}
      data-testid={dataTestId}
      role="listbox"
      aria-orientation="vertical"
      aria-label={ariaLabel}
      isHistory={isHistory}
      width={width}
    >
      {options.map((option, idx) => (
        <StyledListItem
          role="option"
          key={`${option.text.replace(/\s/g, "")}`}
          tabIndex={0}
          onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
            handleKeyDown(event, idx);
          }}
        >
          <SearchOption
            onClick={() => optionClickHandler(option?.value ? option.value : option.text)}
          >
            <OptionIcon />
            <SearchText>{option.text}
              {searchText && <SearchValue> &nbsp;{searchText}</SearchValue>}
            </SearchText>
          </SearchOption>
          {isHistory && (
            <CloseIconWrapper
              role="button"
              onClick={() => optionCloseHandler(option?.value ? option.value : option.text)}
            >
              <CloseSmall />
            </CloseIconWrapper>
          )}
        </StyledListItem>
      ))}
    </StyledUnorderedList>
  );
};
export const useSearchSuggestions = (
  props: ISearchSuggestionsProps,
  onOptionClick?: (selectedOption: string) => void,
): [ISearchSuggestionsElement, ISearchSuggestionsOutput] => {
  const { id, dataTestId, options, optionsType, ariaLabel = "Search Suggestions", searchText, width } = props;

  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [closedOption, setClosedOption] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, currentIndex: number) => {
    if (listRef.current) {
      event.preventDefault();
      let nextIndex = 0;
      if (event.key === "ArrowDown") {
        nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
      } else if (event.key === "ArrowUp") {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
      }
      const nextItem = listRef.current.children[nextIndex];
      if (nextItem) {
        (nextItem as HTMLElement).focus();
      }
    }
  };

  const optionClickHandler = (option: string) => {
    setSelectedSuggestion(option);
    if (onOptionClick) {
      onOptionClick(option);
    }
  };

  const optionCloseHandler = (option: string) => {
    setClosedOption(option);
  };

  const searchSuggestionProps = {
    id,
    dataTestId,
    ariaLabel,
    options,
    optionsType,
    searchText,
    listRef,
    width,
    optionClickHandler,
    optionCloseHandler,
    handleKeyDown,
  };

  const SearchSuggestion: React.FC = () => <Root {...searchSuggestionProps} />;

  return [{ SearchSuggestion }, { selectedSuggestion, closedOption }];
};
