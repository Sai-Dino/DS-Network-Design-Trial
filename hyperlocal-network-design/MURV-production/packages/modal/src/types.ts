import type { ButtonGroupProps } from "@murv/button-group";
import {
  CONFIRMATION_MODAL_CONTENT_VARIANTS,
  MULTIMEDIA_CONTENT_TYPES,
  TEXTLIST_CONTENT_ICON_POSITIONS,
} from "./constants";

export type IDataTestIdProps = {
  dataTestId?: string;
};

export type IModalsContext = {
  modalsStack: string[];
  showModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
};

export type IModalControllerContext = {
  modalId: string;
  closeModal: () => void;
};

export type IModal = IDataTestIdProps & {
  modalId: string;
  onClose?: () => void;
};

export type IModalActions = IDataTestIdProps & { actions: ButtonGroupProps["buttons"] };

export type IConfirmationModalHeader = IDataTestIdProps & {
  header: string;
  showCloseIcon?: boolean;
  onCloseIconClick?: () => void;
};

export type IConfirmationModalContent = IDataTestIdProps & {
  variant?: (typeof CONFIRMATION_MODAL_CONTENT_VARIANTS)[keyof typeof CONFIRMATION_MODAL_CONTENT_VARIANTS];
  primaryText: string;
  secondaryText: string;
  tertiaryText?: string;
  // TODO: Restrict to only react nodes created using DLS Link component.
  link?: JSX.Element;
};

export type ILaunchModalHeader = IDataTestIdProps & {
  header: string;
  subHeader: string;
};

export type ILaunchModalMultimediaContent = IDataTestIdProps & {
  primaryText: string;
  secondaryText: string;
  tertiaryText?: string;
  // TODO: Restrict to only react nodes created using DLS Link component.
  link?: JSX.Element;
} & (
    | {
        resourceType: typeof MULTIMEDIA_CONTENT_TYPES.IMAGE;
        resourceUrl: string;
        resourceAltText: string;
      }
    | {
        resourceType: typeof MULTIMEDIA_CONTENT_TYPES.VIDEO;
        resourceUrl: string;
        resourceCaptionsUrl?: string;
      }
  );

export type ILaunchModalTextListContent = IDataTestIdProps & {
  textList: {
    primaryText: string;
    secondaryText: string;
    icon: string;
  }[];
  iconPosition?: (typeof TEXTLIST_CONTENT_ICON_POSITIONS)[keyof typeof TEXTLIST_CONTENT_ICON_POSITIONS];
};
