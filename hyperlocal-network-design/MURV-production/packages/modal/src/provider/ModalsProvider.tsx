import React, { createContext, useContext, useMemo, useState } from "react";
import { IModalsContext } from "../types";

const ModalsContext = createContext<IModalsContext>({
  modalsStack: [],
  showModal: () => {},
  closeModal: () => {},
});

export const useModalsContext = () => useContext(ModalsContext);

export const ModalsProvider: React.FC = ({ children }) => {
  const [modalsStack, setModalsStack] = useState<string[]>([]);

  const showModal = (modalId: string) =>
    setModalsStack((existingStack) => [...[modalId], ...existingStack]);

  const closeModal = (modalId: string) =>
    setModalsStack((existingStack) => [...existingStack].filter((id) => id !== modalId));

  const contextValue = useMemo(() => ({ modalsStack, showModal, closeModal }), [modalsStack]);

  return <ModalsContext.Provider value={contextValue}>{children}</ModalsContext.Provider>;
};
