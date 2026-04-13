import { PROGRESS_BAR_VARIANTS } from "./constants";

export type TVariants = (typeof PROGRESS_BAR_VARIANTS)[keyof typeof PROGRESS_BAR_VARIANTS];

interface IProgressBarBaseProps {
  /**
   * pass the label for the progress.
   */
  label: string;
  /**
   * Pass the value of the progress.
   */
  value: number;
  /**
   * data testid for the progress
   */
  dataTestId?: string;
}
/**
 * pass this Iprops for the systematic.
 */
export interface ISystematicProgressBarProps extends IProgressBarBaseProps {
  /**
   *  systematic Progress bar.
   */
  variant: typeof PROGRESS_BAR_VARIANTS.SYSTEMATIC;
  /**
   *  Max value is optional here
   */
  max?: 100;
}
/**
 * pass this Iprops for the manual.
 */
export interface IManualProgressBarProps extends IProgressBarBaseProps {
  /**
   *  manual Progress bar .
   */
  variant: typeof PROGRESS_BAR_VARIANTS.MANUAL;
  /**
   *  Max value is required here
   */
  max: number;
}
/**
 * Progress bar has 2 types i.e., systematic and mannual.
 */
export type TProgressBar = ISystematicProgressBarProps | IManualProgressBarProps;
