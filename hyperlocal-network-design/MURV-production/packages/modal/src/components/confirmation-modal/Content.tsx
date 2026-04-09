import React from "react";
import { useTheme } from "styled-components";
import { CheckCircle, Error, Warning } from "@murv/icons";
import Loader from '@murv/loader';
import { IConfirmationModalContent } from "../../types";
import { useModalControls } from "../../provider/ModalController";
import { generateDialogContentId } from "../../utils";
import { CONFIRMATION_MODAL_CONTENT_VARIANTS } from "../../constants";
import { ContentIconWrapper, ContentTextWrapper, ContentWrapper, LoaderContainer } from "./styles";

const getIconForVariant = (variant: IConfirmationModalContent["variant"]) => {
  const theme = useTheme();
  switch (variant) {
    case CONFIRMATION_MODAL_CONTENT_VARIANTS.CAUTION:
      return <Warning size="100%" color={theme.murv.color.icon.warning} fill />;
    case CONFIRMATION_MODAL_CONTENT_VARIANTS.SUCCESS:
      return <CheckCircle size="100%" color={theme.murv.color.icon.success} fill />;
    case CONFIRMATION_MODAL_CONTENT_VARIANTS.WARNING:
      return <Error size="100%" color={theme.murv.color.icon.danger} fill />;
    case CONFIRMATION_MODAL_CONTENT_VARIANTS.PROGRESS:
      return <LoaderContainer><Loader /></LoaderContainer> ;
    case CONFIRMATION_MODAL_CONTENT_VARIANTS.DEFAULT:
      return null;
    default:
      return null;
  }
};

export const ConfirmationModalContent: React.FC<IConfirmationModalContent> = ({
  variant = CONFIRMATION_MODAL_CONTENT_VARIANTS.DEFAULT,
  primaryText,
  secondaryText,
  tertiaryText,
  link,
  dataTestId,
}) => {
  const { modalId } = useModalControls();
  const icon = getIconForVariant(variant);
  return (
    <ContentWrapper id={generateDialogContentId(modalId)} data-testid={dataTestId}>
      {icon && <ContentIconWrapper>{icon}</ContentIconWrapper>}
      <ContentTextWrapper>
        <strong>{primaryText}</strong>
        {secondaryText}
        <span>{tertiaryText}</span>
        {link}
      </ContentTextWrapper>
    </ContentWrapper>
  );
};
