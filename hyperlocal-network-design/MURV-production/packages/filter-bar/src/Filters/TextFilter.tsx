import React, { useCallback, useState, useEffect } from "react";
import { useMURVContext } from "@murv/provider";
import { VisibilityToggleHelper, IVisibilityToggleHelperRef } from "@murv/visibility-toggle";
import DropdownTrigger from "@murv/dropdown-trigger";
import { ChevronRight } from "@murv/icons";
import { TextInput, withRoot } from "@murv/input";
import { SelectRenderProps, TextFilterProps } from "../types";
import { Item } from "../styles";

const TextInputComp = withRoot(TextInput);

const TextFilter: React.FC<SelectRenderProps> = (props) => {
  const { config, filterState, onChange, inline, last } = props;
  const { theme } = useMURVContext();
  const toggleRef = React.useRef<IVisibilityToggleHelperRef>(null);
  const filterProps = config.filterProps as TextFilterProps;
  const [localValue, setLocalValue] = useState((filterState[config.filterId] as string) || "");

  // Sync localValue with filterState when it changes (e.g., on reset)
  useEffect(() => {
    setLocalValue((filterState[config.filterId] as string) || "");
  }, [filterState[config.filterId]]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = event.target.value;
      setLocalValue(newValue);
      onChange(config.filterId, newValue);
    },
    [config.filterId, onChange],
  );

  const value = filterState[config.filterId] as string;

  const renderTarget = useCallback(
    (triggerProps) => (
      <DropdownTrigger
        primaryText={config.filterLabel}
        badgeText={value || undefined}
        disabled={filterProps?.disabled}
        withBorder={false}
        buttonWidth={inline ? undefined : "100%"}
        triggerType="filter"
        renderButtonIcon={inline ? undefined : () => <ChevronRight />}
        maxBadgeWidth="120px"
        {...triggerProps}
      />
    ),
    [config.filterLabel, filterProps, inline, value],
  );

  const dropdown = (
    <VisibilityToggleHelper
      id={`text-filter-${config.filterId}`}
      action="click"
      closeOnClickOutside
      isChildInteractive
      ref={toggleRef}
      position={inline ? "bottom-start" : "right-start"}
      renderTarget={renderTarget}
      popoverStyles={{
        boxShadow: `0px ${theme.spacing.xs} ${theme.spacing.xs} ${theme.spacing.xs} #00000014`,
        border: `1px solid ${theme.color.stroke.primary}`,
        borderRadius: `${theme.radius.s}`,
        padding: theme.spacing.m,
        minWidth: "200px",
      }}
    >
      <TextInputComp
        value={localValue}
        onChange={handleChange}
        placeholder={filterProps?.placeholder || "Enter text..."}
        maxLength={filterProps?.maxLength}
        disabled={filterProps?.disabled}
        type="text"
        label={filterProps?.label}
        helpText={filterProps?.helpText}
        isError={filterProps?.isError}
        width={filterProps?.width}
        testId={`text-filter-${config.filterId}`}
        onFocus={filterProps?.onFocus}
        onHover={filterProps?.onHover}
        onClick={filterProps?.onClick}
        inputHtmlProps={filterProps?.inputHtmlProps}
      />
    </VisibilityToggleHelper>
  );

  return inline ? (
    <Item inline last={last}>
      {dropdown}
    </Item>
  ) : (
    dropdown
  );
};

export default TextFilter;
