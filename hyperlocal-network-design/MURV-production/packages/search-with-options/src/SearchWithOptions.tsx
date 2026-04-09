import React, { useState, useEffect, useCallback, useRef } from "react";
import SingleSelect from "@murv/single-select";
import { Search } from "@murv/search";
import { useSearchSuggestions } from "@murv/search-suggestions";
import { SearchContainer, SelectContainer, SearchSuggestionContainer } from "./styles";
import { ISearchWithOptionsProps, ISearchValue, TYPES } from "./types";

export const SearchWithOptions: React.FC<ISearchWithOptionsProps> = ({
  value,
  onChange,
  onSearch,
  onReset,
  width,
  orientation = TYPES.standard,
  options,
  testId,
  searchComponentProps: { initialQuery: excludeSearchValue, ...restSearchOptions },
}) => {
  const [searchValues, setSearchValues] = useState<ISearchValue>({
    searchValue: value?.searchValue || "",
    selectedOption: value?.selectedOption || options?.[0]?.value || "",
  });

  const [isFocused, setIsFocused] = useState(false);
  const searchInputRef = useRef<{ focus: () => void; blur: () => void; clear: () => void } | null>(
    null,
  );
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchValues({
      searchValue: value?.searchValue || "",
      selectedOption: value?.selectedOption || options?.[0]?.value || "",
    });
  }, [value, options]);

  const onOptionChange = useCallback(
    (selectedOpt: string) => {
      setSearchValues((prev) => ({ ...prev, selectedOption: selectedOpt }));
      onChange?.({ ...searchValues, selectedOption: selectedOpt });
    },
    [searchValues, onChange],
  );

  const onSearchValueChange = useCallback(
    (searchVal: string) => {
      setSearchValues((prev) => ({ ...prev, searchValue: searchVal }));
      onChange?.({ ...searchValues, searchValue: searchVal });
    },
    [searchValues, onChange],
  );

  const onSearchHandler = useCallback(() => {
    if (searchValues.searchValue && orientation === TYPES.static) {
      onSearch?.(searchValues);
    }
  }, [searchValues, onSearch]);

  const onResetHandler = useCallback(() => {
    const resetValues = { searchValue: "", selectedOption: options?.[0]?.value || "" };
    setSearchValues(resetValues);
    onReset?.(resetValues);
  }, [options, onReset]);

  const onSearchOptionSelect = useCallback(
    (selectedOption: string) => {
      setSearchValues((prev) => ({ ...prev, selectedOption }));
      if (searchValues && searchValues?.searchValue && searchValues?.searchValue?.length > 0) {
        onSearch?.({ ...searchValues, selectedOption });
      }
      if (orientation === TYPES.standard) {
        searchInputRef?.current?.blur();
      }
    },
    [searchValues, onSearch, searchInputRef],
  );

  const [{ SearchSuggestion }] = useSearchSuggestions(
    {
      id: "example-id",
      dataTestId: "example-test-id",
      options: options?.map((opt) => ({ text: opt.label, value: opt.value })) || [],
      optionsType: "suggest",
      width: "100%",
      searchText: searchValues.searchValue,
    },
    onSearchOptionSelect,
  );

  const handleBlur = (event: React.FocusEvent) => {
    if (suggestionRef.current && !suggestionRef.current.contains(event.relatedTarget as Node)) {
      setIsFocused(false);
    }
  };

  return (
    <SearchContainer width={width} orientation={orientation} data-testid={testId}>
      {options?.length > 0 && (
        <>
          {orientation === TYPES.static && (
            <SelectContainer>
              <SingleSelect
                value={searchValues.selectedOption}
                options={options}
                onChange={onOptionChange}
                orientation="vertical"
                id="search-select-option"
                name="search-with-options"
                label=""
                popOverWidth={width}
              />
            </SelectContainer>
          )}

          <Search
            ref={searchInputRef}
            initialQuery={searchValues.searchValue}
            {...restSearchOptions}
            onSearch={onSearchHandler}
            onChange={onSearchValueChange}
            onReset={onResetHandler}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            id="search-with-options"
            alwaysShowCloseIcon={orientation === TYPES.static}
          />

          {orientation === TYPES.standard && isFocused && (
            <SearchSuggestionContainer
              ref={suggestionRef}
              onMouseDown={(e) => e.preventDefault()}
              className="search-suggestion-container"
            >
              <SearchSuggestion />
            </SearchSuggestionContainer>
          )}
        </>
      )}
    </SearchContainer>
  );
};
