import React, { useCallback } from "react";
import { VisibilityToggleHelper, IVisibilityToggleHelperRef } from "@murv/visibility-toggle";
import { SelectionCard } from "@murv/selection-card";
import { CheckBoxTreeFilter } from "@murv/checkbox-tree";
import DropdownTrigger from "@murv/dropdown-trigger";
import { MultiSelectProps } from "./types";

export const MultiSelect = ({
  name,
  selected,
  onSelect,
  nodes,
  onApply,
  onClear,
  disabled = false,
  disableApply = false,
  withBorder = false,
  triggerType,
  orientation,
  renderButtonIcon,
  buttonWidth,
  showBadge = true,
  prefixButtonIcon,
  ...rest
}: MultiSelectProps) => {
  const toggleRef = React.useRef<IVisibilityToggleHelperRef>(null);
  const selectedLength = selected.length;
  const renderTarget = useCallback(
    (props) => (
      <DropdownTrigger
        primaryText={showBadge || !selectedLength ? name : `${selectedLength} Selected`}
        disabled={disabled}
        badgeText={showBadge && selectedLength > 0 ? `${selectedLength}` : null}
        withBorder={withBorder}
        buttonWidth={buttonWidth}
        triggerType={triggerType}
        renderButtonIcon={renderButtonIcon}
        prefixButtonIcon={prefixButtonIcon}
        {...props}
      />
    ),
    [selected, disabled],
  );

  const handleApply = () => {
    if (onApply) {
      toggleRef.current?.close();
      onApply(selected);
    }
  };

  return (
    <VisibilityToggleHelper
      offset={{ x: 0, y: 5 }}
      id="multi-select"
      action="click"
      closeOnClickOutside
      isChildInteractive
      ref={toggleRef}
      position={orientation === "horizontal" ? "right-start" : "bottom-start"}
      renderTarget={renderTarget}
    >
      <SelectionCard onApply={onApply && handleApply} onClear={onClear} disableApply={disableApply}>
        <CheckBoxTreeFilter selected={selected} onSelect={onSelect} nodes={nodes} {...rest} />
      </SelectionCard>
    </VisibilityToggleHelper>
  );
};
