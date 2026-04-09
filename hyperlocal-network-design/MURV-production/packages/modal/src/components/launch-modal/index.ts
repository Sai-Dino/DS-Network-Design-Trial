import { LaunchModalHeader } from "./Header";
import { LaunchModalContent } from "./Content";
import { LaunchModalMultimediaContent } from "./MultimediaContent";
import { LaunchModalTextListContent } from "./TextListContent";
import { LaunchModalActions } from "./Actions";
import { StyledModal } from "./styles";

const LaunchModalContentTypes = {
  Multimedia: LaunchModalMultimediaContent,
  TextList: LaunchModalTextListContent,
};

const LaunchModalSubComponents = {
  Header: LaunchModalHeader,
  Actions: LaunchModalActions,
  Content: Object.assign(LaunchModalContent, LaunchModalContentTypes),
  displayName: "LaunchModal",
};

export const LaunchModal = Object.assign(StyledModal, LaunchModalSubComponents);
