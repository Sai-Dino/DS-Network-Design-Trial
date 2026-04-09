import React from "react";
import { ButtonGroup } from "@murv/button-group";
import { Close } from "@murv/icons"
import { CustomToastProps } from "./types";
import { getIconByStatus } from "./Icon";
import { ContentWrapper, Message, IconWrapper } from "./styles";
import "react-toastify/dist/ReactToastify.css";

const CustomToast: React.FC<CustomToastProps> = ({
  id,
  dataTestId,
  status,
  prefixIcon,
  message,
  buttonGroupProps,
  showCloseIcon = true,
  closeToast,
}) => {
  const handleClose = () => {
    closeToast?.();
  };

  return (
    <ContentWrapper className={`${status}`} id={id} data-testid={`toast-${status}-${dataTestId}`}>
      {prefixIcon || getIconByStatus(status)}
      <Message>{message}</Message>
      {buttonGroupProps && <ButtonGroup {...buttonGroupProps} />}
      {showCloseIcon && (
        <IconWrapper onClick={handleClose} data-testid={`toast-close-btn-${dataTestId}`}>
          <Close />
        </IconWrapper>
      )}
    </ContentWrapper>
  );
};
export default CustomToast;
