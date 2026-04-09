import React, { useCallback } from "react";
import { CheckMarkGroupProps } from "./types";
import { CheckMarkGroupWrapper } from "./styles";
import { CheckMarkOption } from "./CheckMarkOption";

export const CheckMarkGroup: React.FunctionComponent<CheckMarkGroupProps> = ({
  readOnly,
  options,
  name,
  value,
  onChange,
  onHover,
  ariaLabel,
  ariaLabelledby,
  orientation = "horizontal",
  checkMarkPosition,
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
    <CheckMarkGroupWrapper
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
        const itemId: string = id ?? `checkMarkOption_${name}_${label}`;

        return (
          <CheckMarkOption
            key={itemId}
            {...rest}
            inputProps={{
              ...inputProps,
              "data-label": label,
              readOnly: true,
            }}
            label={label}
            id={itemId}
            name={name}
            checkMarkPosition={checkMarkPosition}
            {...(controlled && {
              checked: item.value === value,
            })}
          />
        );
      })}
    </CheckMarkGroupWrapper>
  );
};
