import React, { useCallback } from "react";
import { useMURVContext } from "@murv/provider";
import { VisibilityToggleHelper, IVisibilityToggleHelperRef } from "@murv/visibility-toggle";
import DropdownTrigger from "@murv/dropdown-trigger";
import { ChevronRight } from "@murv/icons";
import { CustomDropdownRenderProps } from "../types";
import { Item } from "../styles";

const CustomDropdownFilter: React.FC<CustomDropdownRenderProps> = (props) => {
  const { config, filterState, onChange, inline, last } = props;
  const { theme } = useMURVContext();
  const toggleRef = React.useRef<IVisibilityToggleHelperRef>(null);

  const handleChange = useCallback(
    (value: any) => {
      onChange(config.filterId, value);
      if (!config.filterProps?.isInteractive) {
        toggleRef.current?.close();
      }
    },
    [config.filterId, onChange],
  );

  const value = filterState[config.filterId];

  const renderTarget = useCallback(
    (triggerProps) => (
      <DropdownTrigger
        primaryText={config.filterProps?.showBadge || !value ? config.filterLabel : value}
        disabled={config.filterProps?.disabled}
        badgeText={config.filterProps?.showBadge ? value : null}
        withBorder={false}
        buttonWidth={inline ? undefined : "100%"}
        triggerType="filter"
        renderButtonIcon={inline ? undefined : () => <ChevronRight />}
        prefixButtonIcon={config.filterProps?.prefixButtonIcon}
        {...triggerProps}
      />
    ),
    [config.filterLabel, config.filterProps, inline, value],
  );

  const dropdown = (
    <VisibilityToggleHelper
      id={`custom-dropdown-${config.filterId}`}
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
      }}
    >
      {config.children && config.children({ value, onChange: handleChange })}
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

export default CustomDropdownFilter;
