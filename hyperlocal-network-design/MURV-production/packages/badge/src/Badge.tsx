import React from "react";
import { StyledBadge } from "./styles";
import { BadgeProps } from "./types";

export function Badge({
  id,
  dataTestId,
  title = "Unread notifications",
  type = "highlight",
  children,
  disabled = false,
  ...rest
}: BadgeProps) {
  const isValidContent = typeof children === "number" || typeof children === "string";
  return (
    <StyledBadge
      id={id}
      data-test-id={dataTestId}
      type={type}
      isValidContent={isValidContent}
      disabled={disabled}
      aria-disabled={disabled}
      aria-label={title}
      aria-labelledby={title}
      title={title}
      tabIndex={0}
      {...rest}
    >
      {isValidContent && children}
    </StyledBadge>
  );
}
