import styled, { CSSProperties } from "styled-components";

interface BaseProps {
  border?: CSSProperties["border"];
  borderWidth?: CSSProperties["borderWidth"];
  borderStyle?: CSSProperties["borderStyle"];
  borderColor?: CSSProperties["borderColor"];
  borderRadius?: CSSProperties["borderRadius"];
  backgroundColor?: CSSProperties["backgroundColor"];
  boxShadow?: CSSProperties["boxShadow"];
  padding?: CSSProperties["padding"];
  margin?: CSSProperties["margin"];
  position?: CSSProperties["position"];
  display?: CSSProperties["display"];
  justifyContent?: CSSProperties["justifyContent"];
  alignItems?: CSSProperties["alignItems"];
  overflow?: CSSProperties["overflow"];
  gap?: CSSProperties["gap"];
  justifyItems?: CSSProperties["justifyItems"];
}

const Base = styled.div<BaseProps>`
  border: ${(props) => props.border || undefined};
  border-width: ${(props) => props.borderWidth || undefined};
  border-style: ${(props) => props.borderStyle || undefined};
  border-color: ${(props) => props.borderColor || undefined};
  border-radius: ${(props) => props.borderRadius || undefined};
  background-color: ${(props) => props.backgroundColor || undefined};
  box-shadow: ${(props) => props.boxShadow || undefined};
  padding: ${(props) => props.padding || undefined};
  margin: ${(props) => props.margin || undefined};
  position: ${(props) => props.position || undefined};
  display: ${(props) => props.display || "grid"};
  justify-content: ${(props) => props.justifyContent || "normal"};
  align-items: ${(props) => props.alignItems || "normal"};
  gap: ${(props) => props.gap || undefined};
  overflow: ${(props) => props.overflow || undefined};
  justify-items: ${(props) => props.justifyItems || "normal"};
`;

export const StyledRow = styled(Base)<{
  template?: CSSProperties["gridTemplateColumns"];
  templateAreas?: CSSProperties["gridTemplateAreas"];
}>`
  grid-template-columns: ${(props) => props.template || "repeat(auto-fit, minmax(0, 1fr))"};
  grid-template-areas: ${(props) => props.templateAreas || undefined};
`;

export const StyledCol = styled(Base)<{
  gridTemplateRows?: CSSProperties["gridTemplateRows"];
  gridTemplateColumns?: CSSProperties["gridTemplateColumns"];
}>`
  grid-template-columns: ${(props) => props.gridTemplateColumns || "100%"};
  grid-template-rows: ${(props) => props.gridTemplateRows || "auto"};
`;

export const StyledRoot = styled.div<{
  gridTemplateRows?: CSSProperties["gridTemplateRows"];
  gap?: CSSProperties["gap"];
  height?: string;
  width?: string;
}>`
  display: grid;
  grid-template-rows: ${(props) => props.gridTemplateRows || "auto"};
  height: ${(props) => props.height || "auto"};
  gap: ${(props) => props.gap || 0};
  width: ${(props) => props.width || "100%"};
  overflow: auto;
`;
