export interface SelectionCardProps {
  /* Any children passed is displaed in the card */
  children: React.ReactNode;

  /* onApply is called when Done button is pressed */
  onApply?: (items?: unknown) => void;

  /* onClear is called when Clear button is pressed */
  onClear?: () => void;

  /* Boolean than decides if the Done button is disabled or not */
  disableApply?: boolean;

  /* Test ID */
  dataTestId?: string;

  /* Width of the card */
  width?: string;

  /* Height of the card */
  height?: string;
}
