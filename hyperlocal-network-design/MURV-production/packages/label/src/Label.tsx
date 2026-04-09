import React from "react";
import { LabelWrapper, LabelText, DescriptionText, LabelArea } from "./style";
import { LabelProps } from "./types";

export const Label: React.FC<LabelProps> = ({
  testId = "",
  htmlFor = "",
  disabled = false,
  children,
  description = "",
  label = "",
  rtl = false,
  id = "",
  size = "medium",
  variant = "default",
}) => (
  <LabelWrapper
    id={id}
    data-testid={testId}
    htmlFor={htmlFor}
    disabled={disabled}
    aria-disabled={disabled}
    rtl={rtl}
  >
    {children}
    <LabelArea>
      <LabelText disabled={disabled} aria-disabled={disabled} size={size} variant={variant}>
        {label}
      </LabelText>
      {description && (
        <DescriptionText disabled={disabled} aria-disabled={disabled} variant={variant}>
          {description}
        </DescriptionText>
      )}
    </LabelArea>
  </LabelWrapper>
);
