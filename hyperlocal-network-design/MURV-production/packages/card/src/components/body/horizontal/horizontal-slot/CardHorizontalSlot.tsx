import React from "react";
import isValidChildren from "@murv/core/utils/validate-children";
import { StyledHorizontalItemSlotContainer } from "../../../../styles";
import {
  IAccessibilityProps,
  ICardClickableSlotProps,
  TCardImageComponent,
  TCardTextBlockComponent,
} from "../../../../types";

import { CardHorizontalSlotLink } from "./CardHorizontalSlotLink";
import { ImageComponent } from "../../../common/CardImageHolder";
import { TextBlock } from "../../../common/CardTextBlock";
import { useCardInteractions } from "../../../../hooks/useCardInteractions";

const CardHorizontalSlotIcon: TCardImageComponent = ImageComponent;
const CardHorizontalSlotThumbnail: TCardImageComponent = ImageComponent;

const CardHorizontalSlotTextBlock: TCardTextBlockComponent = TextBlock;

export const CardHorizontalSlot = (
  props: React.PropsWithChildren<ICardClickableSlotProps & IAccessibilityProps>,
) => {
  const { children, containerStyles = {}, onClick, ...rest } = props;
  const { onClick: handleClick, ref } = useCardInteractions(onClick);

  const { isValid } = isValidChildren({
    allowedTypes: [
      CardHorizontalSlotIcon,
      CardHorizontalSlotLink,
      CardHorizontalSlotTextBlock,
      CardHorizontalSlotThumbnail,
    ],
    expectedChildrenCount: 1,
  })(children);

  if (!isValid) {
    return null;
  }
  return (
    <StyledHorizontalItemSlotContainer
      tabIndex={onClick ? 0 : -1}
      onClick={handleClick}
      {...rest}
      ref={ref}
      style={{ ...containerStyles }}
    >
      {children}
    </StyledHorizontalItemSlotContainer>
  );
};

CardHorizontalSlot.Icon = CardHorizontalSlotIcon;
CardHorizontalSlot.Link = CardHorizontalSlotLink;
CardHorizontalSlot.TextBlock = CardHorizontalSlotTextBlock;
CardHorizontalSlot.Thumbnail = CardHorizontalSlotThumbnail;
