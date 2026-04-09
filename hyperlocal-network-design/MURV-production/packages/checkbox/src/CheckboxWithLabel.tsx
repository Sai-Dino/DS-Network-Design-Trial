import React from "react";
import { Label } from "@murv/label";
import { Checkbox } from "./Checkbox";
import { CheckboxWithLabelProps } from "./types";
import { CheckboxWithLabelWrapper } from "./styles";

export const CheckboxWithLabel: React.FunctionComponent<CheckboxWithLabelProps> = ({
  id,
  name,
  label,
  description,
  checked,
  disabled,
  value,
  checkboxPosition = "left",
  inputProps,
  onChange,
}) => (
  <CheckboxWithLabelWrapper data-checkbox-position={checkboxPosition} data-disabled={disabled}>
    <Checkbox
      {...inputProps}
      id={id}
      value={value}
      name={name}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
    />
    <Label label={label} description={description} htmlFor={id} variant="compact" />
  </CheckboxWithLabelWrapper>
);
