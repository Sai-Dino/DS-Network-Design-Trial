import { ConfirmationModalHeader } from "./Header";
import { ConfirmationModalContent } from "./Content";
import { ConfirmationModalActions } from "./Actions";
import { StyledModal } from "./styles";

const ConfirmationModalSubComponents = {
  Header: ConfirmationModalHeader,
  Content: ConfirmationModalContent,
  Actions: ConfirmationModalActions,
  displayName: "ConfirmationModal",
};

export const ConfirmationModal = Object.assign(StyledModal, ConfirmationModalSubComponents);
