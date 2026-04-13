import { useMemo } from "react";
import { useModalsContext } from "../provider/ModalsProvider";
import { generateId } from "../utils";

export const useModal = () => {
  const modalId = useMemo(() => generateId(), []);
  const { modalsStack, showModal, closeModal } = useModalsContext();

  const state = useMemo(
    () => ({
      isVisible: modalsStack[0] === modalId,
      isInStack: modalsStack.includes(modalId),
    }),
    [modalsStack],
  );

  const actions = {
    showModal: () => showModal(modalId),
    closeModal: () => closeModal(modalId),
  };

  return [modalId, state, actions] as const;
};
