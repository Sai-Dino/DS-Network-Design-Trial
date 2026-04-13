import React, { ForwardedRef, ReactElement } from "react";
import Label from "@murv/label";
import DropdownTrigger from "./DropdownTrigger";
import { FieldLabelContainer, FieldWrapper, HelpText } from "./styles";
import { IDropdownFieldProps } from "./types";

const DropdownField = React.forwardRef<HTMLButtonElement, IDropdownFieldProps>(
  (
    {
      label,
      helpText,
      isError = false,
      compact = false,
      optional = false,
      disabled = false,
      width,
      ...dropdownProps
    },
    ref: ForwardedRef<HTMLButtonElement>,
  ): ReactElement => (
    <FieldLabelContainer compact={compact} disabled={disabled || false} width={width}>
      {label && (
        <Label
          label={optional ? `${label} (Optional)` : label}
          disabled={disabled}
          variant={compact ? "compact" : "default"}
          size="small"
        />
      )}
      <FieldWrapper compact={compact} width={dropdownProps.buttonWidth}>
        <DropdownTrigger
          {...dropdownProps}
          disabled={disabled}
          ref={ref}
          data-error={isError ? true : undefined}
        />
        {helpText && (
          <HelpText isError={isError} disabled={disabled || false}>
            {helpText}
          </HelpText>
        )}
      </FieldWrapper>
    </FieldLabelContainer>
  ),
);

DropdownField.displayName = "DropdownField";

export default DropdownField;
