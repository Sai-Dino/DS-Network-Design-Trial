import { ButtonProps } from '@murv/button/src/types';

export enum AlignmentType {
  left = 'left',
  right = 'right',
  center= 'center'
}

export interface ButtonGroupProps {
    /**
     * Accessing the element
     */
    id?: string;
    /**
     * Pointer to test the element
     */
    dataTestId?: string;
    /**
     * Alignment of Buttons - left, right, center
     */
    alignment?: keyof typeof AlignmentType;
    /**
     * Button Props in array format.
     */
    buttons: ButtonProps[];
    /**
     * Padding to override padding style
     */
    padding?: string;
    /**
     * Spacing to override gap style
     */
    spacing?: string;
}

export interface StyledButtonGroupProps{
  alignment?: keyof typeof AlignmentType;
  padding?: string;
  spacing?: string;
}

