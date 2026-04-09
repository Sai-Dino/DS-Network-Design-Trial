import React from "react";
import { Label } from "@murv/label";
import { CheckMark } from "./CheckMark";
import { CheckMarkOptionProps } from "./types";
import { CheckMarkOptionWrapper } from "./styles";

export const CheckMarkOption: React.FunctionComponent<CheckMarkOptionProps> = ({
  id,
  name,
  label,
  value,
  checked,
  disabled,
  checkMarkPosition = "left",
  inputProps,
  style,
  description,
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleWrapperClick = (e: React.MouseEvent) => {
    if (disabled) return;

    // Trigger click on the input element using ref
    if (inputRef.current && e.target !== inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <CheckMarkOptionWrapper
      data-checkmark-position={checkMarkPosition}
      data-disabled={disabled}
      data-checked={checked}
      style={style}
      onClick={handleWrapperClick}
    >
      <CheckMark
        {...inputProps}
        ref={inputRef}
        id={id}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
      />
      <Label
        label={label}
        description={description}
        htmlFor={id}
        disabled={disabled}
        variant="compact"
      />
    </CheckMarkOptionWrapper>
  );
};
