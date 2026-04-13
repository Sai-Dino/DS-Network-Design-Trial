import React from "react";
import Pill, { PillProps } from "@murv/pill";
import { usePill } from "../hooks/usePill";

const PillBase: React.FC<PillProps> = ({
  disabled = false,
  value,
  label,
  tabIndex,
  prefixIcon,
  suffixIcon,
  suffixIconCallBack,
  onFocus,
  onHover,
  testId,
}) => {
  const [{ isInStack, isPrefixReplaceable }, { onSelect }] = usePill(value);

  return (
    <Pill.PillSmall
      testId={testId}
      label={label}
      value={value}
      prefixIcon={prefixIcon}
      suffixIcon={suffixIcon}
      suffixIconCallBack={suffixIconCallBack}
      isPrefixReplaceable={isPrefixReplaceable}
      aria-selected={isInStack}
      selected={isInStack}
      disabled={disabled}
      tabIndex={tabIndex}
      onFocus={onFocus}
      onHover={onHover}
      onClick={() => {
        if (!disabled) {
          onSelect();
        }
      }}
    />
  );
};

export default PillBase;
