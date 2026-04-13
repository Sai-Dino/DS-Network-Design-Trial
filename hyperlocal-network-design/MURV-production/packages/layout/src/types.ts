import React from "react";
import { CSSProperties } from "styled-components";

export interface ColProps {
  children?: React.ReactNode;
  as?: React.ElementType;
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
  gridTemplateRows?: CSSProperties["gridTemplateRows"];
  gridTemplateColumns?: CSSProperties["gridTemplateColumns"];
  gap?: CSSProperties["gap"];
  justifyItems?: CSSProperties["justifyItems"];
}

export interface RowProps {
  children?: React.ReactNode;
  as?: React.ElementType;
  gap?: CSSProperties["gap"];
  template?: CSSProperties["gridTemplateColumns"];
  templateAreas?: CSSProperties["gridTemplateAreas"];
  border?: CSSProperties["border"];
  borderRadius?: CSSProperties["borderRadius"];
  borderStyle?: CSSProperties["borderStyle"];
  borderColor?: CSSProperties["borderColor"];
  borderWidth?: CSSProperties["borderWidth"];
  backgroundColor?: CSSProperties["backgroundColor"];
  boxShadow?: CSSProperties["boxShadow"];
  justifyContent?: CSSProperties["justifyContent"];
  alignItems?: CSSProperties["alignItems"];
  padding?: CSSProperties["padding"];
  margin?: CSSProperties["margin"];
  position?: CSSProperties["position"];
  overflow?: CSSProperties["overflow"];
  justifyItems?: CSSProperties["justifyItems"];
}

export interface RootProps {
  children?: React.ReactNode;
  as?: React.ElementType;
  gap?: CSSProperties["gap"];
  gridTemplateRows?: CSSProperties["gridTemplateRows"];
  height?: string;
  width?: string;
}
