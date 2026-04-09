import React from "react";
import { ILaunchModalTextListContent } from "../../types";
import { TEXTLIST_CONTENT_ICON_POSITIONS } from "../../constants";
import { TextListSampleIcon } from "../../icons/TextListSampleIcon";
import { TextListContentItem, TextListContentWrapper } from "./styles";

export const LaunchModalTextListContent: React.FC<ILaunchModalTextListContent> = ({
  textList,
  iconPosition = TEXTLIST_CONTENT_ICON_POSITIONS.LEFT,
  dataTestId,
}) => (
  <TextListContentWrapper data-testid={dataTestId}>
    {textList.map(({ primaryText, secondaryText, icon }) => (
      <TextListContentItem iconPosition={iconPosition}>
        {icon && <TextListSampleIcon />}
        <p>
          <strong>{primaryText}</strong>
          {secondaryText}
        </p>
      </TextListContentItem>
    ))}
  </TextListContentWrapper>
);
