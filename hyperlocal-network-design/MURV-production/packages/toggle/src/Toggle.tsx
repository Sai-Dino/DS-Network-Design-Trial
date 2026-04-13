import React, { useCallback } from "react";
import { Label } from "@murv/label";
import { ToggleSwitch } from "./ToggleSwitch";
import { ToggleProps } from "./types";
import { ToggleOptionWrapper } from "./styles";

export const Toggle: React.FunctionComponent<ToggleProps> = ({
  id,
  name,
  label,
  value,
  checked,
  disabled,
  switchPosition = "left",
  inputProps,
  style,
  ariaLabel,
  ariaLabelledby,
  onChange,
  readOnly,
  dataTestId,
  description,
}) => {
  const toggleSwitch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (readOnly) return;
      if (!onChange) return;

      onChange(e);
    },
    [readOnly, onChange],
  );

  const controlled = !!onChange;

  return (
    <ToggleOptionWrapper
      data-toggle-position={switchPosition}
      data-disabled={disabled}
      style={style}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      data-testid={dataTestId}
    >
      <ToggleSwitch
        {...inputProps}
        id={id}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        {...(controlled && {
          onChange: toggleSwitch,
          checked,
        })}
      />
      <Label label={label} description={description} htmlFor={id} />
    </ToggleOptionWrapper>
  );
};
