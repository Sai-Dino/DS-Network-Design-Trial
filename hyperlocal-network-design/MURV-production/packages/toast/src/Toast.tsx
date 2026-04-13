import React from "react";
import { toast } from "react-toastify";
import CustomToast from "./CustomToast";
import { ToastProps } from "./types";
import { StatusType } from "./constants";

const nonAutoCloseTimeout = 20000; // 20 seconds

export const Toast = {
  success: ({
    message,
    id,
    dataTestId,
    prefixIcon,
    buttonGroupProps,
    autoClose,
    showCloseIcon,
    onCloseCallback,
    containerId,
  }: ToastProps) => {
    toast.success(
      <CustomToast
        id={id}
        dataTestId={dataTestId}
        prefixIcon={prefixIcon}
        message={message}
        buttonGroupProps={buttonGroupProps}
        status={StatusType.success}
        showCloseIcon={showCloseIcon}
      />,
      {
        onClose: onCloseCallback,
        autoClose: autoClose === false ? nonAutoCloseTimeout : autoClose,
        containerId,
      },
    );
  },
  error: ({
    message,
    id,
    dataTestId,
    prefixIcon,
    buttonGroupProps,
    autoClose,
    showCloseIcon,
    containerId,
    onCloseCallback,
  }: ToastProps) => {
    toast.error(
      <CustomToast
        id={id}
        dataTestId={dataTestId}
        prefixIcon={prefixIcon}
        message={message}
        buttonGroupProps={buttonGroupProps}
        status={StatusType.error}
        showCloseIcon={showCloseIcon}
      />,
      {
        onClose: onCloseCallback,
        autoClose: autoClose === false ? nonAutoCloseTimeout : autoClose,
        containerId,
      },
    );
  },
  warning: ({
    message,
    id,
    dataTestId,
    prefixIcon,
    buttonGroupProps,
    autoClose,
    showCloseIcon,
    onCloseCallback,
    containerId,
  }: ToastProps) => {
    toast.warning(
      <CustomToast
        id={id}
        dataTestId={dataTestId}
        prefixIcon={prefixIcon}
        message={message}
        buttonGroupProps={buttonGroupProps}
        status={StatusType.warning}
        showCloseIcon={showCloseIcon}
      />,
      {
        onClose: onCloseCallback,
        autoClose: autoClose === false ? nonAutoCloseTimeout : autoClose,
        containerId,
      },
    );
  },
  information: ({
    message,
    id,
    dataTestId,
    prefixIcon,
    buttonGroupProps,
    autoClose,
    showCloseIcon,
    onCloseCallback,
    containerId,
  }: ToastProps) => {
    toast.info(
      <CustomToast
        id={id}
        dataTestId={dataTestId}
        prefixIcon={prefixIcon}
        message={message}
        buttonGroupProps={buttonGroupProps}
        status={StatusType.information}
        showCloseIcon={showCloseIcon}
      />,
      {
        onClose: onCloseCallback,
        autoClose: autoClose === false ? nonAutoCloseTimeout : autoClose,
        containerId,
      },
    );
  },
};
