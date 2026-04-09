import React, { ForwardedRef, ReactElement } from "react";
import { ExpandMore } from "@murv/icons";
import { ButtonText, DropdownButton, StyledBadge } from "./styles";
import { IDropdownTriggerProps } from "./types";

const DropdownTrigger = React.forwardRef<HTMLButtonElement, IDropdownTriggerProps>(
  (
    {
      primaryText,
      badgeText,
      disabled,
      triggerType,
      withBorder,
      renderButtonIcon,
      maxBadgeWidth,
      buttonWidth,
      prefixButtonIcon,
      ...targetProps
    },
    ref: ForwardedRef<HTMLButtonElement>,
  ): ReactElement => (
    <DropdownButton
      disabled={disabled}
      role="combobox"
      triggerType={triggerType}
      withBorder={withBorder}
      buttonWidth={buttonWidth}
      data-testid="dropdown-trigger"
      {...targetProps}
      ref={ref}
    >
      {prefixButtonIcon ? prefixButtonIcon() : null}
      <ButtonText>{primaryText}</ButtonText>
      {badgeText && (
        <StyledBadge title={badgeText} type="subtle" maxBadgeWidth={maxBadgeWidth}>
          {badgeText}
        </StyledBadge>
      )}
      {renderButtonIcon ? renderButtonIcon() : <ExpandMore />}
    </DropdownButton>
  ),
);
export default DropdownTrigger;
