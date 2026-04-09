import React, { useCallback } from "react";
import { RadioGroupProps } from "./types";
import { RadioGroupWrapper } from "./styles";
import { RadioOption } from "./RadioOption";

export const RadioGroup: React.FunctionComponent<RadioGroupProps> = ({
  readOnly,
  options,
  name,
  value,
  onChange,
  onHover,
  ariaLabel,
  ariaLabelledby,
  orientation = "horizontal",
  radioPosition,
  style,
  dataTestId,
}) => {
  const onValueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (readOnly) return;
      if (!onChange) return;

      onChange(e);
    },
    [readOnly, onChange],
  );

  const controlled = !!onChange;

  return (
    <RadioGroupWrapper
      role="radiogroup"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      onChange={onValueChange}
      onMouseEnter={onHover}
      data-orientation={orientation}
      style={style}
      data-testid={dataTestId}
    >
      {options.map((item) => {
        const { id, label, inputProps = {}, ...rest } = item;
        const itemId: string = id ?? `radioOption_${name}_${label}`;

        return (
          <RadioOption
            key={itemId}
            {...rest}
            inputProps={{
              ...inputProps,
              readOnly: true,
            }}
            label={label}
            id={itemId}
            name={name}
            radioPosition={radioPosition}
            {...(controlled && {
              checked: item.value === value,
            })}
          />
        );
      })}
    </RadioGroupWrapper>
  );
};
