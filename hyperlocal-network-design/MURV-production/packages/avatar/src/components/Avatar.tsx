import React from "react";
import { AvatarProps } from '../types';
import {
  StyledAvatar,
  StyledBadge
} from '../styles';

/**
 * Avatar Component
 */
export const Avatar:React.FC<AvatarProps> = ({
  dataTestId,
  size,
  type,
  children,
  badgeProps
}) => (
      <StyledAvatar
        data-testid = {dataTestId}
        size={size}
        type={type}
      >
        {children}
        {badgeProps && <StyledBadge {...badgeProps} />}
      </StyledAvatar>
);
