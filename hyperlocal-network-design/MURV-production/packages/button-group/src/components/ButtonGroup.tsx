import React from "react";
import { Button } from '@murv/button';
import { ButtonGroupProps } from '../types';
import {
  StyledContainer
} from '../styles';

/**
 * Button Group Component
 */
export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  dataTestId,
  id,
  alignment,
  buttons,
  padding,
  spacing
}) => (
      <StyledContainer
        id={id} 
        data-test-id={dataTestId} 
        alignment={alignment}
        padding={padding}
        spacing={spacing}
      >
        {buttons.map((buttonProps, index: number) => (
          // eslint-disable-next-line react/no-array-index-key
          <Button key={`button-${index}`} {...buttonProps} />
        ))}

      </StyledContainer>
  );