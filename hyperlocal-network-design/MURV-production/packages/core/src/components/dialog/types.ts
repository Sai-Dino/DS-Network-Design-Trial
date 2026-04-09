import { DIALOG_MODES } from "./constants";

export type IDialogModes = (typeof DIALOG_MODES)[keyof typeof DIALOG_MODES];

export type IDialogElementRef = {
  show: () => void;
  close: () => void;
  open: boolean;
};

export type IDialogElementProps = {
  id: string;
  mode?: IDialogModes;
  dataTestId?: string;
  className?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  onClose?: () => void;
};
