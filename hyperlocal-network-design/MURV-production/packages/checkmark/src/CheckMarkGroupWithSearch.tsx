import React, { useMemo, useRef, useState } from "react";
import { RefType, Search } from "@murv/search";
import SearchFeedback from "@murv/search-feedback";
import Loader from "@murv/loader";
import { CheckMarkGroup } from "./CheckMarkGroup";
import { CheckMarkGroupSearchProps, Option } from "./types";
import {
  CheckMarkGroupSearchWrapper,
  SelectedValueOption,
  LoaderContainer,
  SearchWrapper,
} from "./styles";
import { CheckMarkOption } from "./CheckMarkOption";

const getSelectedOption = (options: Option[], selectedValue?: string) => {
  const selectedOptionFind = options.find((option) => option.value === selectedValue) || null;
  return selectedOptionFind;
};

const CheckMarkGroupWithSearch: React.FC<CheckMarkGroupSearchProps> = ({
  readOnly,
  options,
  name,
  value,
  onChange,
  ariaLabel,
  ariaLabelledby,
  showCheckedValue = false,
  orientation = "vertical",
  checkMarkPosition = "right",
  style,
  dataTestId,
  id,
  placeholder = "Search Parameter",
  debounceTimer,
  disabled,
  onHandleSearch,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const filteredOptions = useMemo(() => {
    if (searchTerm && !onHandleSearch) {
      return options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    return options;
  }, [searchTerm, onHandleSearch, options]);

  const ref = useRef<RefType>(null);
  const selectedOption = useMemo(() => getSelectedOption(options, value), [options, value]);

  const handleSearch = (searchValue: string) => {
    if (onHandleSearch) {
      onHandleSearch(searchValue);
    } else {
      setSearchTerm(searchValue);
    }
  };

  const handleReset = () => {
    setSearchTerm(null);
    if (onHandleSearch) {
      onHandleSearch(null);
    }
    ref.current?.clear();
  };

  return (
    <CheckMarkGroupSearchWrapper
      style={style}
      data-testid={dataTestId}
      id={id ? `${id}-checkmark-search` : "checkmark-search"}
    >
      <SearchWrapper>
        <Search
          onSearch={handleSearch}
          id={id ? `${id}-checkmarkgroup-search` : "checkmarkgroup-search"}
          placeholder={placeholder}
          debounceTimer={debounceTimer}
          onChange={handleSearch}
          disabled={disabled}
          ref={ref}
        />
      </SearchWrapper>

      {isLoading ? (
        <LoaderContainer>
          <Loader />
        </LoaderContainer>
      ) : (
        <>
          {showCheckedValue && !searchTerm && selectedOption && (
            <SelectedValueOption>
              <CheckMarkOption
                id={selectedOption.id ? `${selectedOption.id}-selected-option` : "selected-option"}
                name={selectedOption.label}
                label={selectedOption.label}
                value={selectedOption?.value}
                description={selectedOption?.description}
                checkMarkPosition="right"
                checked
                disabled={selectedOption?.disabled}
              />
            </SelectedValueOption>
          )}
          {searchTerm && (
            <SearchFeedback
              actionLabel="Copy"
              foundItemCount={filteredOptions.length}
              foundItems={[filteredOptions.length > 0 && searchTerm ? searchTerm : ""]}
              notFoundItemCount={filteredOptions.length === 0 ? 1 : 0}
              notFoundItems={[filteredOptions.length === 0 && searchTerm ? searchTerm : ""]}
              onReset={handleReset}
              totalItemCount={options.length}
            />
          )}
          <CheckMarkGroup
            readOnly={readOnly}
            options={filteredOptions}
            name={name}
            value={value || ""}
            onChange={onChange || (() => {})}
            ariaLabel={ariaLabel}
            ariaLabelledby={ariaLabelledby}
            orientation={orientation}
            checkMarkPosition={checkMarkPosition}
            dataTestId={dataTestId?.concat("-checkmarkgroup")}
          />
        </>
      )}
    </CheckMarkGroupSearchWrapper>
  );
};

export default CheckMarkGroupWithSearch;
