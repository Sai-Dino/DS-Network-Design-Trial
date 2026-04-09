import React from "react";
import { DividerDiv } from "./style";
import { DividerProps } from "./types";

export function Divider({ direction = "vertical", additionalStyles }: DividerProps) {
  return <DividerDiv direction={direction} style={additionalStyles} />;
}

export default Divider;
