export interface ITriggerInternalProps {
  /* To dropdown button text Eg. 'Locations' */
  primaryText?: string;

  /* To badge text  eg. 'Malur BTS' */
  badgeText?: string;
}

export type TriggerType = "standAlone" | "filter";

export interface IStyledBadgeProps {
  /* To control max wodth of the badge */
  maxBadgeWidth?: number | string | undefined;
}
export interface IDropDownButtonProps extends IStyledBadgeProps {
  /* Width of the button */
  buttonWidth?: string | undefined;
  /* For disableing the dropdown button */
  disabled?: boolean | undefined;

  /* To show Border around dropdown button */
  withBorder?: boolean | undefined;

  /* To render custom dropdown button icon */
  renderButtonIcon?: () => React.JSX.Element | undefined;

  triggerType?: TriggerType;
  /* popover direction */
  orientation?: "horizontal" | "vertical";
  /* prefix icons for dropdown */
  prefixButtonIcon?: () => React.JSX.Element | undefined;
}

export interface IDropdownTriggerProps extends ITriggerInternalProps, IDropDownButtonProps {}

export interface IDropdownFieldProps extends IDropdownTriggerProps {
  label?: string;
  helpText?: string;
  isError?: boolean;
  compact?: boolean;
  optional?: boolean;
  width?: string;
}
