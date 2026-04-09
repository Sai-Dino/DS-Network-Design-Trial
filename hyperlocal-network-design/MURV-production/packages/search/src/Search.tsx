import React, { useState, forwardRef, useRef, useCallback, useImperativeHandle } from "react";
import debounce from "lodash.debounce";
import { Search as SearchIcon, Close } from "@murv/icons";
import { useMURVContext } from "@murv/provider";
import {
  AfterInput,
  BeforeInput,
  IconWrapper,
  SearchInputField,
  SearchWrapper,
  SuffixContainer,
} from "./styles";
import { ISearchProps, RefType } from "./types";
import SeparatorIcon from "./Icons/SeparatorIcon";

export const Search = forwardRef<RefType, ISearchProps>(
  (
    {
      id,
      testId,
      name = "Search",
      placeholder = "Search...",
      initialQuery,
      onSearch,
      onClear,
      debounceTimer = 300,
      onChange,
      disabled = false,
      alwaysShowCloseIcon,
      onReset,
      onBlur,
      onFocus,
      prefixIcon,
      renderSuffix,
    },
    ref,
  ) => {
    const [searchQuery, setSearchQuery] = useState(initialQuery || "");
    const inputRef = useRef<HTMLInputElement>(null);
    const { theme } = useMURVContext();

    const debouncedOnChange = onChange && useCallback(debounce(onChange, debounceTimer), []);

    const clearMouseDown = useRef(false);

    const handleClearMouseDown = () => {
      if (onBlur) {
        clearMouseDown.current = true;
      }
    };

    const handleInputBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      if (clearMouseDown.current) {
        clearMouseDown.current = false;
        return; // Skip onBlur logic
      }
      if (onBlur) onBlur(event);
    };

    const focusInputElement = () => {
      if (inputRef.current) inputRef.current.focus();
    };

    const blurInputElement = () => {
      if (inputRef.current) inputRef.current.blur();
    };

    useImperativeHandle(
      ref,
      () => ({
        focus: focusInputElement,
        blur: blurInputElement,
        clear: () => {
          if (!disabled) setSearchQuery("");
        },
      }),
      [],
    );

    const setQueryAndNotifyChange = (value: string) => {
      setSearchQuery(value);
      if (debouncedOnChange) debouncedOnChange(value, id);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setQueryAndNotifyChange(event.target.value);
    };

    const handleClearClick = () => {
      if (!disabled) {
        if (onReset) {
          setSearchQuery("");
          onReset("", id);
        } else {
          setQueryAndNotifyChange("");
        }
        focusInputElement();
        if (onClear) onClear(id);
      }
    };

    const handleSearchClick = () => {
      if (searchQuery && !disabled && onSearch) onSearch(searchQuery, id); // Pass the id to the onSearch callback
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
      // Check if it's the Enter key
      // event.repeat prevents the action from firing multiple times if held down
      if (event.key === "Enter" && !event.repeat) {
        event.preventDefault();
        handleSearchClick();
      }
    };

    return (
      <SearchWrapper data-test-id={testId} onClick={focusInputElement} $showPrefixIcon={prefixIcon}>
        <BeforeInput>
          <IconWrapper className="search-icon icon">
            <SearchIcon color={theme.color.icon.secondary} />
          </IconWrapper>
        </BeforeInput>

        <SearchInputField
          id={id}
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => onFocus && onFocus(id)}
          onBlur={handleInputBlur}
          disabled={disabled}
          aria-placeholder={placeholder}
          aria-label={name}
        />

        <AfterInput onMouseDown={handleClearMouseDown}>
          {/* TO DO : Use a button component designed for button that only have icons */}
          {(searchQuery || alwaysShowCloseIcon) && !disabled && (
            <IconWrapper className="clear-icon trigger enabled" onClick={handleClearClick}>
              <Close color={theme.color.icon.secondary} />
            </IconWrapper>
          )}
          {(searchQuery || alwaysShowCloseIcon) && !disabled && (
            <IconWrapper className="separator-icon">
              <SeparatorIcon />
            </IconWrapper>
          )}
          <IconWrapper
            className={`search-icon trigger ${searchQuery && !disabled ? "enabled" : "disabled"}`}
            onClick={handleSearchClick}
          >
            <SearchIcon color={theme.color.icon.secondary} />
          </IconWrapper>
          {renderSuffix && (
            <SuffixContainer className="suffix-container">{renderSuffix()}</SuffixContainer>
          )}
        </AfterInput>
      </SearchWrapper>
    );
  },
);
