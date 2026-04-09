import React from "react";
import { useCardInteractions } from "../../hooks/useCardInteractions";
import {
  StyledPrimaryLineContainer,
  StyledSecondaryLineContainer,
  StyledTertiaryLineContainer,
  StyledTextBlockContainer,
} from "../../styles";
import { IAccessibilityProps, ICardTextBlockProps } from "../../types";

export const TextBlock: React.FC<ICardTextBlockProps & IAccessibilityProps> = (props) => {
  const {
    children,
    onClick,
    primaryLine,
    secondaryLine,
    tertiaryLine,
    containerStyles = {},
    ...rest
  } = props;
  const { onClick: handleClick, ref } = useCardInteractions(onClick);
  return (
    <StyledTextBlockContainer
      tabIndex={onClick ? 0 : -1}
      onClick={handleClick}
      {...rest}
      ref={ref}
      style={{ ...containerStyles }}
    >
      <StyledPrimaryLineContainer>{primaryLine}</StyledPrimaryLineContainer>
      {secondaryLine && (
        <StyledSecondaryLineContainer>{secondaryLine}</StyledSecondaryLineContainer>
      )}
      {tertiaryLine && <StyledTertiaryLineContainer>{tertiaryLine}</StyledTertiaryLineContainer>}
    </StyledTextBlockContainer>
  );
};
