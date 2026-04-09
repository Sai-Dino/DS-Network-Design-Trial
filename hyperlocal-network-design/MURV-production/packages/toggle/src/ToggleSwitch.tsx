import React from "react";
import { ToggleInput } from "./styles";
import { ToggleSwitchProps } from "./types";

export const ToggleSwitch: React.FunctionComponent<ToggleSwitchProps> = (props) => (
  <ToggleInput {...props} type="checkbox" />
);
