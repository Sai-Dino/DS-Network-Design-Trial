import React from "react";
import { Check } from "@murv/icons";
import { CheckMarkWrapper } from "./styles";
import { CheckMarkProps } from "./types";

export const CheckMark = React.forwardRef<HTMLInputElement, CheckMarkProps>((props, ref) => (
  <CheckMarkWrapper>
    <input {...props} ref={ref} type="radio" />
    <Check size="16px" />
  </CheckMarkWrapper>
));
