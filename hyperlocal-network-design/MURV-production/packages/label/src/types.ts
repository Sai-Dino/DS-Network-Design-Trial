/**
 * Label variant type - "default" for standard labels, "compact" for checkbox/checkmark labels
 */
export type LabelVariant = "default" | "compact";

/**
 * Represents the properties of a label component.
 */
export interface LabelProps extends React.HTMLAttributes<HTMLLabelElement> {
  /**
   * The content of the label.
   */
  children?: React.ReactNode;
  /**
   * A unique identifier for testing purposes.
   */
  testId?: string;
  /**
   * The ID of the form element that the label is associated with.
   */
  htmlFor?: string;
  /**
   * Specifies whether the label is disabled or not.
   */
  disabled?: boolean;
  /**
   * The text of the label.
   */
  label?: string;
  /**
   * A description or additional information about the label.
   */
  description?: string;
  /**
   * Specifies whether the label should be displayed in right-to-left (RTL) direction.
   */
  rtl?: boolean;
  /**
   * The size of the label text.
   */
  size?: string;
  /**
   * The variant of the label. Use "compact" for checkbox/checkmark labels.
   */
  variant?: LabelVariant;
}
