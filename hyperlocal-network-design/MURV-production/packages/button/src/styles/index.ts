import styled from "styled-components";
import { ButtonSize, StyledButtonProps, BtnChildProps } from "../types";

const FlexConatiner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const StyledButton = styled.button<StyledButtonProps>`
  /* Typography */
  font-size: 13px;
  font-weight: 600;

  /* Border Radius */
  border-radius: ${(props) =>
    props.buttonType === "floating" ? props.theme.murv.spacing.xxl : props.theme.murv.spacing.s};

  /* Background Color */
  background-color: ${(props) =>
    props.buttonBGColor(
      props.buttonType,
      props.buttonStyle,
      "",
      props.disabled ?? false,
      props.isLoading ?? false,
    )};

  /* Text Color */
  color: ${(props) =>
    props.buttonTextColor(props.buttonType, props.buttonStyle, props.disabled ?? false) ||
    props.theme.murv.color.surface.neutral.default};

  /* Flex Layout */
  display: flex;
  justify-content: center;
  gap: ${(props) => props.theme.murv.spacing.xxs};
  align-items: center;

  /* Height */
  height: 36px;

  /* Cursor */
  cursor: ${(props) => (props.disabled || props.isLoading ? "not-allowed" : "pointer")};

  /* Pointer events for non-clickable */
  pointer-events: ${(props) => (props.isLoading ? "none" : "auto")};

  /* Padding */
  padding: ${(props) => `${props.theme.murv.spacing.s} ${props.theme.murv.spacing.l}`};

  /* Border */
  border: ${(props) =>
    `${props.buttonBorderColor(
      props.buttonType,
      props.buttonStyle,
      "default",
      props.disabled ?? false,
    )}`};

  /* Outline */
  outline: none;

  /* Max Width */
  max-width: 280px;

  /* Hover Styles */
  &:hover {
    background-color: ${(props) =>
      props.buttonBGColor(props.buttonType, props.buttonStyle, "hover", props.disabled ?? false)};
    border: ${(props) =>
      `${props.buttonBorderColor(
        props.buttonType,
        props.buttonStyle,
        "hover",
        props.disabled ?? false,
      )}`};
  }

  /* Focus Styles */
  &:focus-visible {
    ${(props) =>
      props.renderBorder(props.buttonType)
        ? `
      outline: 2px solid ${props.theme.murv.color.surface.brand.default};
      outline-offset: 2px;
    `
        : ``}
    background-color: ${(props) =>
      props.buttonBGColor(props.buttonType, props.buttonStyle, "focus", props.disabled ?? false)};
    border: ${(props) =>
      `${props.buttonBorderColor(
        props.buttonType,
        props.buttonStyle,
        "focus",
        props.disabled ?? false,
      )}`};
    color: ${(props) =>
      props.buttonType === "inline" &&
      props.buttonStyle === "brand" &&
      `${props.theme.murv.color.surface.brand.hover}`};
  }

  /* Active (on Pressed) Styles */
  &:active {
    background-color: ${(props) =>
      props.buttonBGColor(props.buttonType, props.buttonStyle, "active", props.disabled ?? false)};
  }

  /* Media Query for Small Screens */
  @media only screen and (max-width: 600px) {
    max-width: 328px;
    height: ${(props) => props.mapButtonSize(props.buttonSize)};
    padding: ${(props) =>
      props.buttonSize === ButtonSize.small
        ? `${props.theme.murv.spacing.xs} ${props.theme.murv.spacing.l}`
        : `${props.theme.murv.spacing.m} ${props.theme.murv.spacing.l}`};
    min-width: ${(props) =>
      props.buttonSize === ButtonSize.small ? props.theme.murv.spacing.xxxl : "40px"};
  }

  /* Additional Styles for specific button types */
  ${(props) =>
    props.buttonType === "inline" &&
    `
      padding: ${props.theme.murv.spacing.m} ${props.theme.murv.spacing.xxxs};
      height: 20px;
      @media only screen and (max-width: 600px) {
        padding: 0px;
        height: 20px;
      }
    `}
  ${(props) =>
    props.isLoading &&
    `
      width: 36px;
      @media only screen and (max-width: 600px){
        width: ${props.buttonSize === ButtonSize.small ? props.theme.murv.spacing.xxxl : "40px"};
      }
      ${props.buttonType !== "secondary" && `border: none;`}
      ${props.buttonType === "floating" && `border-radius: ${props.theme.murv.radius.xxl}`}
    `}

  ${(props) =>
    props.buttonType === "floating" &&
    props.disabled &&
    `
      box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.20);
    `}
`;

export const BtnChild = styled.span<BtnChildProps>`
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const Container = styled.div``;

export const LoaderContainer = styled.div``;

export const SuffixContainer = styled(FlexConatiner)``;

export const PrefixContainer = styled(FlexConatiner)``;
