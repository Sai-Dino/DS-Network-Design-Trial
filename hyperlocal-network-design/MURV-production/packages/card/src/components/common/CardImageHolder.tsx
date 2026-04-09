import React, { useCallback } from "react";
import { useCardInteractions } from "../../hooks/useCardInteractions";
import { ICardImageProps } from "../../types";
import { StyledImageHolder } from "../../styles";

export const ImageComponent = (props: ICardImageProps) => {
  const { src, alt, svg, onClick, containerStyles = {}, ...rest } = props;
  const { onClick: handleClick, ref } = useCardInteractions(onClick);
  const getKomponent = useCallback(() => {
    if (svg) {
      return svg;
    }
    if (src) {
      return <img src={src} alt={alt} style={{ ...containerStyles }} {...rest} />;
    }
    return null;
  }, [svg, src]);
  return (
    <StyledImageHolder tabIndex={onClick ? 0 : -1} onClick={handleClick} ref={ref}>
      {getKomponent()}
    </StyledImageHolder>
  );
};
