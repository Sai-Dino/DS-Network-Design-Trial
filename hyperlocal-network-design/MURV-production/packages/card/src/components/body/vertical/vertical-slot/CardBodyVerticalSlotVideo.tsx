import React from "react";
import { useCardInteractions } from "../../../../hooks/useCardInteractions";
import { StyledVideoContainer } from "../../../../styles";
import { ICardVideoProps } from "../../../../types";

export const CardBodyVerticalSlotVideo = (props: ICardVideoProps) => {
  const { src, onClick, containerStyles = {}, trackSrc, ...rest } = props;
  const { onClick: handleClick, ref } = useCardInteractions();
  if (!src) {
    return null;
  }
  return (
    <StyledVideoContainer
      tabIndex={onClick ? 0 : -1}
      onClick={handleClick}
      {...rest}
      ref={ref}
      style={{ ...containerStyles }}
    >
      <video {...rest} src={src}>
        <track src={trackSrc} kind="captions" srcLang="en" label="english_captions" />
      </video>
    </StyledVideoContainer>
  );
};
