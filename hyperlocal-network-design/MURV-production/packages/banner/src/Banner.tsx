import React, { useState } from "react";
import Tag from "@murv/tag";
import { ButtonGroup } from "@murv/button-group";
import { Close } from "@murv/icons";
import { BannerProps } from "./types";
import { getIconByStatus } from "./Icon";
import { TagText, TagStyleType } from "./constants";
import {
  BannerContainer,
  ContentWrapper,
  PrimaryText,
  SecondaryText,
  TertiaryText,
  IconWrapper,
} from "./styles";

export const Banner: React.FC<BannerProps> = ({
  id,
  dataTestId,
  status,
  tagProps,
  showStatusTag = true,
  prefixIcon,
  primaryText,
  secondaryText,
  tertiaryText,
  buttonGroupProps,
  showCloseIcon = true,
  onCloseButtonClick,
}) => {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      onCloseButtonClick?.();
    }, 300);
  };

  if (!visible) return null;

  const renderTag = () => {
    if (!showStatusTag) return null;
    return tagProps ? (
      <Tag {...tagProps} />
    ) : (
      <Tag tagText={TagText[status]} tagStyle={TagStyleType[status]} />
    );
  };

  return (
    <BannerContainer
      className={status}
      id={id}
      data-testid={dataTestId}
      visible={visible}
      exiting={exiting}
    >
      <ContentWrapper>
        {prefixIcon || getIconByStatus(status)}
        {renderTag()}
        {primaryText && <PrimaryText>{primaryText}</PrimaryText>}
        <SecondaryText>{secondaryText}</SecondaryText>
        {tertiaryText && <TertiaryText>{tertiaryText}</TertiaryText>}
        {buttonGroupProps && <ButtonGroup {...buttonGroupProps} />}
      </ContentWrapper>
      {showCloseIcon && (
        <IconWrapper onClick={handleClose} data-testid="icon-wrapper">
          <Close />
        </IconWrapper>
      )}
    </BannerContainer>
  );
};
