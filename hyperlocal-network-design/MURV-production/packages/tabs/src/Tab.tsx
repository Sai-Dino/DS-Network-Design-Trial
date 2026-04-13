import React, { KeyboardEvent, useCallback, useMemo, useRef } from "react";
import Tag from "@murv/tag";
import { ITabControlProps } from "./types";
import { TabBase, TabLabelWrapper, TabPrefixIconWrapper, TabSuffixIconWrapper } from "./styles";
import {
  createTabId,
  createTabItemTestId,
  createTabPanelId,
  createTabPrefixIconTestId,
  createTabSuffixIconTestId,
  createTabTagTestId,
} from "./utils";
import { TAB_VARIANTS } from "./constants";

export const Tab = React.forwardRef<HTMLButtonElement, ITabControlProps>((props, ref) => {
  const {
    title,
    value,
    prefixIcon,
    tag,
    suffixIcon,
    variant,
    selected,
    disabled = false,
    onClick,
    onKeyDown: outerOnKeyDown,
    tabsInstanceId,
    dataTestId = tabsInstanceId,
  } = props;

  const suffixIconRef = useRef<HTMLButtonElement>(null);
  const showSuffix = useMemo(
    () => !!suffixIcon && !!suffixIcon.icon && !!suffixIcon.onClick,
    [suffixIcon],
  );

  const suffixIconOnKeyDown = useCallback(
    (keyEvent: KeyboardEvent<HTMLButtonElement>) => {
      if (suffixIconRef.current) {
        suffixIconRef.current.ariaHidden = "true";
        suffixIconRef.current.ariaLabel = null;
      }
      switch (keyEvent.key) {
        case "Enter":
        case " ":
          keyEvent.stopPropagation();
          suffixIcon?.onClick();
          break;
        case "Tab":
          keyEvent.stopPropagation();
          outerOnKeyDown(keyEvent);
          break;
        default:
          break;
      }
    },
    [suffixIcon, outerOnKeyDown],
  );

  const tabOnKeyDown = useCallback(
    (keyEvent: KeyboardEvent<HTMLButtonElement>) => {
      switch (keyEvent.key) {
        case "Tab":
          // Special handling in case we show the suffix icon button to make the keyboard navigation seamless.
          if (showSuffix && !keyEvent.shiftKey) {
            keyEvent.preventDefault();
            if (suffixIconRef.current) {
              suffixIconRef.current.ariaHidden = "false";
              suffixIconRef.current.ariaLabel = suffixIcon?.ariaLabel ?? null;
              suffixIconRef.current.focus();
            }
          } else {
            outerOnKeyDown(keyEvent);
          }
          break;
        default:
          outerOnKeyDown(keyEvent);
      }
    },
    [suffixIcon, outerOnKeyDown],
  );

  return (
    <TabBase
      role="tab"
      id={createTabId(tabsInstanceId, value)}
      aria-controls={createTabPanelId(tabsInstanceId, value)}
      aria-selected={selected}
      aria-disabled={disabled}
      disabled={disabled}
      selected={selected}
      variant={variant}
      onClick={onClick}
      onKeyDown={tabOnKeyDown}
      ref={ref}
      tabIndex={selected ? 0 : -1}
      data-testid={createTabItemTestId(dataTestId, value)}
    >
      {prefixIcon && prefixIcon.icon && (
        <TabPrefixIconWrapper
          variant={variant}
          selected={selected}
          data-testid={createTabPrefixIconTestId(dataTestId, value)}
          role="img"
          aria-label={prefixIcon.ariaLabel}
        >
          {prefixIcon.icon}
        </TabPrefixIconWrapper>
      )}
      {title}
      {tag && variant === TAB_VARIANTS.DEFAULT && (
        <TabLabelWrapper
          variant={variant}
          selected={selected}
          data-testid={createTabTagTestId(dataTestId, value)}
        >
          <Tag tagText={tag.tagText} tagStyle={tag.tagStyle} />
        </TabLabelWrapper>
      )}
      {showSuffix && (
        <TabSuffixIconWrapper
          ref={suffixIconRef}
          role="button"
          tabIndex={-1}
          variant={variant}
          selected={selected}
          onClick={(event) => {
            event.stopPropagation();
            suffixIcon!.onClick();
          }}
          onKeyDown={suffixIconOnKeyDown}
          disabled={disabled}
          data-testid={createTabSuffixIconTestId(dataTestId, value)}
          aria-hidden
        >
          {suffixIcon?.icon}
        </TabSuffixIconWrapper>
      )}
    </TabBase>
  );
});
