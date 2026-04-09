import React from "react";
import { TagProps } from "./types";
import { TagContainer, TagText } from "./styles";

/**
 * A tag is used to label, categorize, or organize items using keywords that describe them.
 */
export const Tag: React.FC<TagProps> = ({
  id,
  dataTestId,
  tagText,
  tagStyle = "submitted",
  alignment = "regular",
  backgroundColor,
  textColor,
}) => {
  if (typeof tagText !== "string" || tagText.trim() === "") {
    throw new Error('The "tagText" prop must be a non-empty string.');
  }
  return (
    <TagContainer
      id={id}
      data-testid={dataTestId}
      tagStyle={tagStyle}
      alignment={alignment}
      backgroundColor={backgroundColor}
      textColor={textColor}
    >
      <TagText>{tagText}</TagText>
    </TagContainer>
  );
};
