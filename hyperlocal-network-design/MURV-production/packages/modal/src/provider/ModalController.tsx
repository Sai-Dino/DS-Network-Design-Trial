import React, { createContext, useContext, useMemo } from "react";
import { IModalControllerContext } from "../types";
import { useModalsContext } from "./ModalsProvider";

const ModalContollerContext = createContext<IModalControllerContext>({
  modalId: "",
  closeModal: () => {},
});

export const useModalControls = () => useContext(ModalContollerContext);

export const ModalController: React.FC<Pick<IModalControllerContext, "modalId">> = ({
  modalId,
  children,
}) => {
  const { closeModal } = useModalsContext();

  const contextValue = useMemo(
    () => ({ modalId, closeModal: () => closeModal(modalId) }),
    [modalId, closeModal, modalId],
  );

  return (
    <ModalContollerContext.Provider value={contextValue}>{children}</ModalContollerContext.Provider>
  );
};
