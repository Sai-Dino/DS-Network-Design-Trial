import React from "react";
import { InputRadio } from "./styles";
import { RadioProps } from "./types";

export const Radio: React.FunctionComponent<RadioProps> = (props) => (
  <InputRadio {...props} type="radio" />
);
