import React from "react";
import { useMURVContext } from "@murv/provider";
import { IndeterminateCheckBox, CheckBox, CheckBoxOutlineBlank } from "@murv/icons";
import { InputCheckboxWrapper } from "./styles";
import { CheckboxProps } from "./types";

const getIcon = (indeterminate?: boolean, checked?: boolean) => {
  const { theme } = useMURVContext();
  if (indeterminate) return <IndeterminateCheckBox fill size="16px" />;
  if (checked) return <CheckBox fill size="16px" />;
  return <CheckBoxOutlineBlank color={theme.color.text.secondary} size="16px" />;
};

export const Checkbox: React.FunctionComponent<CheckboxProps> = (props) => {
  const { indeterminate, checked } = props;

  return (
    <InputCheckboxWrapper>
      <input {...props} type="checkbox" />
      {getIcon(indeterminate, checked)}
    </InputCheckboxWrapper>
  );
};
