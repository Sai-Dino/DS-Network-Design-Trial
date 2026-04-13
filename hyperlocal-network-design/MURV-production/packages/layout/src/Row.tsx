import React from "react";
import { StyledRow } from "./styles";
import { RowProps } from "./types";

export const Row = ({
  children,
  as,
  gap,
  template,
  templateAreas,
  border,
  borderRadius,
  borderStyle,
  borderColor,
  borderWidth,
  backgroundColor,
  boxShadow,
  justifyContent,
  alignItems,
  padding,
  margin,
  position,
  overflow,
  justifyItems,
}: RowProps) => (
  <StyledRow
    as={as}
    gap={gap}
    template={template}
    templateAreas={templateAreas}
    border={border}
    borderStyle={borderStyle}
    borderColor={borderColor}
    borderWidth={borderWidth}
    borderRadius={borderRadius}
    backgroundColor={backgroundColor}
    boxShadow={boxShadow}
    justifyContent={justifyContent}
    alignItems={alignItems}
    padding={padding}
    margin={margin}
    position={position}
    overflow={overflow}
    justifyItems={justifyItems}
  >
    {children}
  </StyledRow>
);
