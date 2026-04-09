import { ICheckBoxTreeFilterProps } from "@murv/checkbox-tree";
import { IDropDownButtonProps } from "@murv/dropdown-trigger";
import { SelectionCardProps } from "@murv/selection-card";

export interface MultiSelectProps
  extends Omit<SelectionCardProps, "children">,
    IDropDownButtonProps,
    ICheckBoxTreeFilterProps {
  /* Used as the Drodown button Label */
  name: string;
  showBadge?: boolean;
  buttonWidth?: string;
  prefixButtonIcon?: () => React.JSX.Element | undefined;
}
