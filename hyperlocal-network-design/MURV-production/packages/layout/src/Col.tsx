import React from "react";
import { StyledCol } from "./styles";
import { ColProps } from "./types";

export const Col = ({
  children,
  as,
  gap,
  border,
  borderWidth,
  borderStyle,
  borderColor,
  borderRadius,
  backgroundColor,
  boxShadow,
  padding,
  margin,
  position,
  display,
  justifyContent,
  alignItems,
  overflow,
  gridTemplateRows,
  gridTemplateColumns,
  justifyItems,
}: ColProps) => (
  <StyledCol
    as={as}
    gap={gap}
    border={border}
    borderWidth={borderWidth}
    borderStyle={borderStyle}
    borderColor={borderColor}
    borderRadius={borderRadius}
    backgroundColor={backgroundColor}
    boxShadow={boxShadow}
    padding={padding}
    margin={margin}
    position={position}
    display={display}
    justifyContent={justifyContent}
    alignItems={alignItems}
    overflow={overflow}
    gridTemplateRows={gridTemplateRows}
    gridTemplateColumns={gridTemplateColumns}
    justifyItems={justifyItems}
  >
    {children}
  </StyledCol>
);
