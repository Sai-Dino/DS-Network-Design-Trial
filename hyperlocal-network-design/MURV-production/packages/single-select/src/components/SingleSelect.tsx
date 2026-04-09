import React, { useCallback, useMemo } from "react";
import { useMURVContext } from "@murv/provider";
import { CheckMarkGroupWithSearch, CheckMarkGroup } from "@murv/checkmark";
import VisibilityToggleHelper, { IVisibilityToggleHelperRef } from "@murv/visibility-toggle";
import DropdownTrigger from "@murv/dropdown-trigger";
import Button from "@murv/button";
import {
  DropdownContent,
  SingleSelectContainer,
  ResetContainer,
  CheckmarkContainer,
} from "../styles";
import { SingleSelectProps } from "../types";

export const SingleSelect: React.FC<SingleSelectProps> = ({
  label,
  orientation = "horizontal",
  withSearch,
  popOverWidth = "300px",
  value,
  disabled,
  onChange = () => {},
  options,
  withBorder,
  triggerType,
  maxBadgeWidth,
  renderButtonIcon,
  buttonWidth,
  showBadge = true,
  prefixButtonIcon,
  showReset = false,
  ...rest
}) => {
  const { theme } = useMURVContext();
  const toggleRef = React.useRef<IVisibilityToggleHelperRef>(null);
  const optionObject = useMemo(() => {
    const obj: { [key: string]: string } = {};
    // Loop through the options array and construct the object
    if (options) {
      options.forEach(({ label: optionLabel, value: optionValue }) => {
        obj[optionValue] = optionLabel;
      });
    }
    return obj;
  }, [options]);

  const renderTarget = useCallback(
    (props) => (
      <DropdownTrigger
        primaryText={showBadge || !value ? label : optionObject[value] || value}
        disabled={disabled}
        withBorder={withBorder}
        buttonWidth={buttonWidth}
        maxBadgeWidth={maxBadgeWidth}
        badgeText={showBadge && value ? optionObject[value] || value : null}
        renderButtonIcon={renderButtonIcon}
        triggerType={triggerType}
        prefixButtonIcon={prefixButtonIcon}
        {...props}
      />
    ),
    [value, disabled],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    toggleRef.current?.close();
  };

  const getOrientation = () => {
    switch (orientation) {
      case "horizontal":
        return "right-start";
      case "vertical":
        return "bottom-start";
      case "top":
        return "top-start";
      case "vertical-reverse":
        return "bottom-end";
      default:
        return "bottom-start";
    }
  };

  return (
    <SingleSelectContainer>
      <VisibilityToggleHelper
        id="single-select"
        action="click"
        closeOnClickOutside
        isChildInteractive
        ref={toggleRef}
        position={getOrientation()}
        renderTarget={renderTarget}
        popoverStyles={{
          boxShadow: `0px ${theme.spacing.xs} ${theme.spacing.xs} ${theme.spacing.xs} #00000014`,
          border: `1px solid ${theme.color.stroke.primary}`,
          borderRadius: `${theme.radius.s}`,
        }}
      >
        <DropdownContent popOverWidth={popOverWidth}>
          <CheckmarkContainer>
            {withSearch !== false ? (
              <CheckMarkGroupWithSearch
                options={options}
                {...rest}
                value={value || ""}
                checkMarkPosition="right"
                orientation="vertical"
                onChange={handleChange}
              />
            ) : (
              <CheckMarkGroup
                options={options}
                {...rest}
                value={value || ""}
                checkMarkPosition="right"
                orientation="vertical"
                onChange={handleChange}
              />
            )}
          </CheckmarkContainer>
          {showReset && (
            <ResetContainer>
              <Button onClick={() => onChange("")} buttonType="inline">
                Reset
              </Button>
            </ResetContainer>
          )}
        </DropdownContent>
      </VisibilityToggleHelper>
    </SingleSelectContainer>
  );
};
