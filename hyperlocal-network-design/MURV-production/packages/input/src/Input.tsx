import React, { FunctionComponent, RefObject } from "react";
import { Error, Resize } from "@murv/icons";
import { useMURVContext } from "@murv/provider";
import {
  InputContainer,
  InputLabel,
  Instruction,
  StyledInput,
  StyledTextArea,
  InputLabelContainer,
  Count,
  InstructionText,
  SuffixIconWrapper,
  InputWrapper,
  OptionalText,
  ResizeIconWrapper,
  PrefixIconWrapper,
} from "./styles";
import { IInputProps, IInputWithLabelProps } from "./types";
import { InputType } from "./constants";

/**
 * The TextBox & TextArea component is a reusable UI element designed for creating Input Text & TextArea within your application. It gives the functionality to capture user text/number. This component abstracts the implementation details of Input & TextBox, providing a consistent and easily customizable way to create TextBoxes.
 */

export function TextInput({ disabled = false, ...props }: Partial<IInputProps>) {
  return (
    <StyledInput
      disabled={disabled}
      ref={props.inputRef as RefObject<HTMLInputElement>}
      {...props}
    />
  );
}

export function TextArea({ disabled = false, ...props }: Partial<IInputProps>) {
  return (
    <StyledTextArea
      disabled={disabled}
      ref={props.inputRef as RefObject<HTMLTextAreaElement>}
      rows={4}
      cols={25}
      {...props}
    />
  );
}

export const withRoot = (Component: FunctionComponent<Partial<IInputProps>>) => {
  function WithCommonText({
    actionIcon = null,
    prefixIcon = null,
    suffixIcon = null,
    disabled = false,
    testId = "",
    placeholder = "",
    value = "",
    isError = false,
    onChange = () => {},
    onHover = () => {},
    onFocus = () => {},
    onClick = () => {},
    label = "",
    helpText = "",
    maxLength,
    compact = false,
    inputHtmlProps,
    width = "100%",
    optional,
    type,
    ...otherProps
  }: IInputWithLabelProps) {
    const { theme } = useMURVContext();

    const onChangeHandler = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange(event);
    };

    const PrefixIcon = prefixIcon || null;
    const SuffixIcon = suffixIcon || null;
    const ActionIcon = actionIcon || null;

    const showCount = () => {
      if (!!maxLength && maxLength > 0) {
        if (typeof value === "string") {
          return (
            <Count>
              {value?.length}/{maxLength}
            </Count>
          );
        }
        if (typeof value === "number") {
          return (
            <Count>
              {value?.toString()?.length}/{maxLength}
            </Count>
          );
        }
      }
      return null;
    };

    return (
      <InputLabelContainer
        onMouseEnter={onHover}
        onMouseLeave={onHover}
        onFocus={onFocus}
        compact={compact}
        onClick={onClick}
        disabled={disabled}
        width={width as string}
      >
        {label ? (
          <InputLabel compact={compact}>
            {label}
            {optional && <OptionalText>(Optional)</OptionalText>}
          </InputLabel>
        ) : null}
        <InputWrapper compact={compact} width={width as string}>
          <InputContainer
            fieldType={isError ? "error" : "default"}
            disabled={disabled}
            compact={compact}
          >
            <PrefixIconWrapper
              content={Component.displayName === InputType.TEXT_AREA ? "space-between" : "center"}
            >
              {PrefixIcon}
            </PrefixIconWrapper>
            <Component
              onChange={onChangeHandler}
              value={value}
              disabled={disabled}
              data-testid={testId}
              placeholder={placeholder}
              required={!optional}
              maxLength={maxLength}
              type={type}
              {...{
                ...inputHtmlProps,
                ...otherProps,
              }}
            />
            <SuffixIconWrapper
              content={Component.displayName === InputType.TEXT_AREA ? "space-between" : "center"}
            >
              {isError || ActionIcon || SuffixIcon ? (
                <>
                  {isError ? <Error color={theme.color.stroke.danger} /> : SuffixIcon}
                  {!isError ? ActionIcon : null}
                </>
              ) : null}
            </SuffixIconWrapper>
            {Component.displayName === InputType.TEXT_AREA && (
              <ResizeIconWrapper>
                <Resize />
              </ResizeIconWrapper>
            )}
          </InputContainer>
          {helpText || maxLength ? (
            <Instruction isError={isError} disabled={disabled}>
              {helpText ? <InstructionText className="helpText">{helpText}</InstructionText> : null}
              {showCount()}
            </Instruction>
          ) : null}
        </InputWrapper>
      </InputLabelContainer>
    );
  }
  return WithCommonText;
};

TextInput.displayName = InputType.TEXT_INPUT;
TextArea.displayName = InputType.TEXT_AREA;

const TextBoxInput = withRoot(TextInput);
const TextAreaInput = withRoot(TextArea);

export { TextBoxInput, TextAreaInput };
