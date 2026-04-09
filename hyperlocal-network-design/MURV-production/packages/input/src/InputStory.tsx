import React from "react";
import { IInputProps, IInputWithLabelProps } from "./types";
import { TextBoxInput, TextAreaInput } from "./Input";

function TextInputStory(props: IInputWithLabelProps & IInputProps) {
  return <TextBoxInput {...props} />;
}

function TextAreaStory(props: IInputWithLabelProps & IInputProps) {
  return <TextAreaInput {...props} />;
}

export { TextInputStory, TextAreaStory };
