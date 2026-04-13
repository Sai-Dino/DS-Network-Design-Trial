import { BadgeProps } from '@murv/badge';

export interface AvatarProps {
    /**
     * Pointer to test the element
     */
    dataTestId?: string;
    /**
     * Define the size of avatar - small, medium or large
     */
    size?: 'small' | 'medium' | 'large';
    /**
     * Define the type of avatar - Image, Icon, or Text
     */
    type: 'image' | 'icon' | 'text';
    /**
     * Content of Avatar
     */
    children: React.ReactNode;
    /**
     * Used to render Badge component with respective props
     */
    badgeProps?: BadgeProps;
}

export interface StyledAvatarProps{
  size? : 'small' | 'medium' | 'large';
  type: 'image' | 'icon' | 'text';
}

