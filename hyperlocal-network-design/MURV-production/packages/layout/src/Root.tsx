import React from "react";
import { StyledRoot } from "./styles";
import { RootProps } from "./types";

/* When to use Root:
Full-page layouts (header, content, footer)
Vertical section stacking
Fixed-height containers that need scrolling
Page-level structure organization */

export const Root = ({ children, as, gap, gridTemplateRows, height, width }: RootProps) => (
  <StyledRoot as={as} gap={gap} gridTemplateRows={gridTemplateRows} height={height} width={width}>
    {children}
  </StyledRoot>
);
