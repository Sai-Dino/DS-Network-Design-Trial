import React, { useCallback } from "react";
import { CheckboxWithLabel } from "./CheckboxWithLabel";
import { CheckboxGroupProps } from "./types";
import { CheckboxGroupWrapper } from './styles';

export const CheckboxGroup: React.FunctionComponent<CheckboxGroupProps> = ({
   readOnly,
   options,
   orientation = "horizontal",
   ariaLabel,
   ariaLabelledby,
   onChange,
   onHover,
   checkboxPosition,
   dataTestId,
   value
}) => {

  const onValueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (readOnly) return;
      if (!onChange) return;
      onChange(e);
    },
    [readOnly, onChange],
  );

  return (
    <CheckboxGroupWrapper
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      onChange={onValueChange}
      onMouseEnter={onHover}
      data-orientation={orientation}
      data-testid={dataTestId}
    >
      {options.map((item) => {
        const { id, label, inputProps, ...rest } = item;
        const itemId: string = id ?? `checkboxOption_${label}`;
        return (
          <CheckboxWithLabel
            key={itemId}
            {...rest}
            inputProps={{
              ...inputProps,
              readOnly: true,
            }}
            label={label}
            id={itemId}
            checked={value.includes(item.value as string)}
            checkboxPosition={checkboxPosition}
          />
        );
      })}
    </CheckboxGroupWrapper>
  );
};