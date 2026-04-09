import React from "react";
import Loader from "@murv/loader";
import { ButtonProps, BtnType, ButtonSize, BtnStyleType } from "../types";
import useButtonUtils from "../utils";
import {
  StyledButton,
  BtnChild,
  PrefixContainer,
  SuffixContainer,
  LoaderContainer,
} from "../styles";

/**
 * Primary UI component for user interaction
 */

export const Button: React.FC<ButtonProps> = ({
  children,
  type = BtnType.button,
  className,
  disabled = false,
  dataTestId,
  buttonType = BtnStyleType.primary,
  buttonStyle = "brand",
  onClick,
  PrefixIcon = null,
  SuffixIcon = null,
  isLoading = false,
  size = ButtonSize.large,
  ...rest
}) => {
  const {
    mapButtonBGColor,
    mapButtonBorderColor,
    mapButtonTextColor,
    mapBtnSize,
    renderContainerBorder,
    mapIconColorWithBtnType,
  } = useButtonUtils();

  // Callbacks for suffix icon and btn
  const handleSuffixCallback = (event: React.MouseEvent) => {
    event?.stopPropagation();
    if (rest.suffixCallback) {
      rest.suffixCallback();
    }
    if (onClick) {
      onClick();
    }
  };

  return (
    <StyledButton
      type={type}
      className={`${buttonType} ${className || ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      data-testid={dataTestId}
      buttonType={buttonType}
      buttonStyle={buttonStyle}
      buttonSize={size}
      assignWidth={!!children}
      isLoading={isLoading}
      buttonBGColor={mapButtonBGColor}
      buttonBorderColor={mapButtonBorderColor}
      buttonTextColor={mapButtonTextColor}
      mapButtonSize={mapBtnSize}
      renderBorder={renderContainerBorder}
      {...rest}
    >
      {isLoading ? (
        <LoaderContainer data-testid="loader-icon">
          <Loader
            customColor={mapIconColorWithBtnType(disabled ? "disabled" : buttonType, buttonStyle)}
          />
        </LoaderContainer>
      ) : (
        <>
          {PrefixIcon ? (
            <PrefixContainer
              data-testid="add-icon"
              className={`${className ? `${className}_prefix_container` : ""}`}
            >
              <PrefixIcon
                color={mapIconColorWithBtnType(disabled ? "disabled" : buttonType, buttonStyle)}
              />
            </PrefixContainer>
          ) : null}
          {children && (
            <BtnChild
              disabled={disabled}
              className={`${className ? `${className}_child_container` : ""}`}
            >
              {children}
            </BtnChild>
          )}
          {SuffixIcon ? (
            <SuffixContainer
              data-testid="dropdown-icon"
              className={`${className ? `${className}_suffix_container` : ""}`}
              onClick={handleSuffixCallback}
            >
              <SuffixIcon
                color={mapIconColorWithBtnType(disabled ? "disabled" : buttonType, buttonStyle)}
              />
            </SuffixContainer>
          ) : null}
        </>
      )}
    </StyledButton>
  );
};
