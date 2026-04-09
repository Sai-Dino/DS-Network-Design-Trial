import React from "react";
import { CustomToastContainer } from "./styles";
import { ToastComponentProps, TransitionComponents } from "./types";
import { PositionType } from "./constants";

export const ToastComponent: React.FC<ToastComponentProps> = ({
  position = PositionType.bottomCenter,
  autoClose = 5000,
  newestOnTop = true,
  transition = "Slide",
  containerId,
}) => (
  <CustomToastContainer
    position={position}
    autoClose={autoClose}
    newestOnTop={newestOnTop}
    containerId={containerId}
    closeOnClick={false}
    closeButton={false}
    draggable={false}
    hideProgressBar
    transition={TransitionComponents[transition]}
    limit={3}
    pauseOnHover={false}
    icon={false}
  />
);
