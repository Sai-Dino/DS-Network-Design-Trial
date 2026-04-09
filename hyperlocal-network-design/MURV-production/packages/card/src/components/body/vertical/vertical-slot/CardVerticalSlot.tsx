import React from "react";
import isValidChildren from "@murv/core/utils/validate-children";
import { StyledVerticalItemSlotContainer } from "../../../../styles";
import {
  IAccessibilityProps,
  ICardClickableSlotProps,
  TCardImageComponent,
  TCardTextBlockComponent,
} from "../../../../types";

import { CardBodyVerticalSlotCarousal } from "./CardBodyVerticalSlotCarousal";
import { CardBodyVerticalSlotVideo } from "./CardBodyVerticalSlotVideo";
import { ImageComponent } from "../../../common/CardImageHolder";
import { TextBlock } from "../../../common/CardTextBlock";
import { useCardInteractions } from "../../../../hooks/useCardInteractions";

const CardBodyVerticalSlotImage: TCardImageComponent = ImageComponent;
const CardBodyVerticalSlotTextBlock: TCardTextBlockComponent = TextBlock;

export const CardVerticalSlot = (
  props: React.PropsWithChildren<ICardClickableSlotProps & IAccessibilityProps>,
) => {
  const { children, containerStyles = {}, onClick, ...rest } = props;
  const { onClick: handleClick, ref } = useCardInteractions(onClick);

  const { isValid } = isValidChildren({
    allowedTypes: [
      CardBodyVerticalSlotCarousal,
      CardBodyVerticalSlotImage,
      CardBodyVerticalSlotTextBlock,
      CardBodyVerticalSlotVideo,
    ],
    expectedChildrenCount: 1,
  })(children);

  if (!isValid) {
    return null;
  }
  return (
    <StyledVerticalItemSlotContainer
      tabIndex={onClick ? 0 : -1}
      onClick={handleClick}
      {...rest}
      ref={ref}
      style={{ ...containerStyles }}
    >
      {children}
    </StyledVerticalItemSlotContainer>
  );
};

CardVerticalSlot.Carousal = CardBodyVerticalSlotCarousal;
CardVerticalSlot.Image = CardBodyVerticalSlotImage;
CardVerticalSlot.TextBlock = CardBodyVerticalSlotTextBlock;
CardVerticalSlot.Video = CardBodyVerticalSlotVideo;
