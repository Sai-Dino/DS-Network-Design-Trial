import React from "react";
import { Label } from "@murv/label";
import { Radio } from "./Radio";
import { RadioOptionProps } from "./types";
import { RadioOptionWrapper } from "./styles";

export const RadioOption: React.FunctionComponent<RadioOptionProps> = ({
  id,
  name,
  label,
  value,
  checked,
  disabled,
  radioPosition = "left",
  inputProps,
  style,
  description,
}) => (
  <RadioOptionWrapper data-radio-position={radioPosition} data-disabled={disabled} style={style}>
    <Radio
      {...inputProps}
      id={id}
      name={name}
      value={value}
      checked={checked}
      disabled={disabled}
    />
    <Label label={label} description={description} htmlFor={id} />
  </RadioOptionWrapper>
);
