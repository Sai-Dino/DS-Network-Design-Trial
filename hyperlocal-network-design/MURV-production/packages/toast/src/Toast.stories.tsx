import React from "react";
import { ButtonGroupProps } from "@murv/button-group";
import { Add } from "@murv/icons";
import { ToastComponent } from "./ToastContainer";
import { Toast } from "./Toast";
import CustomToast from "./CustomToast";
import { PositionType } from "./constants";

export default {
  title: "Components/Toast",
  component: CustomToast,
  tags: ["autodocs"],
};

const closeCallbackFn = () => {};
const buttonGroupProps: ButtonGroupProps = {
  buttons: [
    {
      buttonType: "inline",
      buttonStyle: "brand",
      PrefixIcon: Add,
      onClick: () => {},
    },
    {
      buttonType: "inline",
      buttonStyle: "brand",
      children: "Button",
      onClick: () => {},
    },
  ],
  alignment: "right",
  padding: "0px",
};

export const DefaultToastView = () => (
  <div style={{ display: "flex", gap: "10px" }}>
    <button type="button" onClick={() => Toast.success({ message: "successful message" })}>
      Open Success Toast
    </button>
    <button
      type="button"
      onClick={() => Toast.error({ message: "Error message", onCloseCallback: closeCallbackFn })}
    >
      Open Error Toast
    </button>
    <button
      type="button"
      onClick={() => Toast.warning({ message: "Warning message", buttonGroupProps })}
    >
      Open Warning Toast with Button Group Prop
    </button>
    <button
      type="button"
      onClick={() => Toast.information({ message: "Insightful message", autoClose: 8000 })}
    >
      Open information Toast with specific autoclose time: 8s
    </button>
    <ToastComponent
      position={PositionType.bottomCenter} // position to show toasts default position is bottom center
      autoClose={4000} // default auto close timeout for all toast if autoclose not set for toast
      newestOnTop // in group of toasts where should new toast be shown, default value true
      transition="Slide" // transition effect for toast, default set to Slide
      containerId="toast-container-root" // id of toast container, optional,
      // if multiple ToastComponent with different props are used then this containerId can be used to select the ToastComponent to show the toast
    />
  </div>
);

export const ToastViewWithoutCloseBtn = () => (
  <div style={{ display: "flex", gap: "10px" }}>
    <button
      type="button"
      onClick={() =>
        Toast.success({ message: "successful message", showCloseIcon: false, autoClose: false })
      }
    >
      Toast with autoclose = false, showCloseIcon = false
    </button>
    <button
      type="button"
      onClick={() =>
        Toast.error({ message: "Error message", showCloseIcon: false, autoClose: 10000 })
      }
    >
      Error Toast with autoClose = 10000, showCloseIcon = false
    </button>
    <button
      type="button"
      onClick={() =>
        Toast.warning({
          message: "Warning message",
          showCloseIcon: false,
          buttonGroupProps,
        })
      }
    >
      Warning Toast with buttonGroupProps, showCloseIcon = false
    </button>
    <button
      type="button"
      onClick={() => Toast.information({ message: "Insightful message", showCloseIcon: false })}
    >
      Information Toast with showCloseIcon = false
    </button>
    <ToastComponent />
  </div>
);

export const ToastViewWithAction = () => (
  <div style={{ display: "flex", gap: "10px" }}>
    <button
      type="button"
      onClick={() =>
        Toast.success({
          message:
            "successful message Consequat minim cillum elit tempor ut do cillum culpa qui pariatur exercitation laborum fugiat. Reprehenderit exercitation reprehenderit adipisicing consequat cupidatat. Excepteur aute laboris cupidatat essedsdfsdfsd occaecat. Qui nostrud proident in duis ipsum irure pariatur. Veniam consequat mollit esse nostrud mollit sunt elit incididunt. Ad ullamco ullamco do eu Lorem magna sint esse consectetur nulla fugiat.",
        })
      }
    >
      Success Toast with long text, only limited amount is shown
    </button>
    <button
      type="button"
      onClick={() =>
        Toast.error({
          message:
            "Error message Aute anim eiusmod dolore aliquip eiusmod qui nulla consectetur duis ad consequat.",
        })
      }
    >
      Error Toast with medium length of message
    </button>
    <button type="button" onClick={() => Toast.warning({ message: "Warning message" })}>
      Warning Toast with short message
    </button>
    <button type="button" onClick={() => Toast.information({})}>
      Information Toast without message
    </button>
    <ToastComponent />
  </div>
);
