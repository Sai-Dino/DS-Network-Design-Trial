import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Link } from "@murv/link";
import { ConfirmationModal } from "./components/confirmation-modal";
import { useModal } from "./hooks/useModal";
import { ModalsProvider } from "./provider/ModalsProvider";
import { IConfirmationModalContent, IConfirmationModalHeader, IModalActions } from "./types";

type ConfirmationModalArgTypes = {
  HeaderProps: IConfirmationModalHeader;
  ContentProps: IConfirmationModalContent;
  ActionsProps: IModalActions;
  dataTestId: string;
};

const meta = {
  title: "Components/Modal/ConfirmationModal",
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <ModalsProvider>
        <Story />
        <p style={{ marginTop: "16px" }}>
          <small>
            <b>Note:</b> You may notice that the close button has focus when the modal opens. This
            is in accordance with the{" "}
            <a
              href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog#usage_notes:~:text=The%20autofocus%20attribute,it%20to%20dismiss"
              target="_blank"
              rel="noreferrer"
            >
              W3C HTML Spec for the Dialog element
            </a>
            . If you want some other element to recieve focus by default, then please set the{" "}
            <a
              href="https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/autofocus"
              target="_blank"
              rel="noreferrer"
            >
              <strong>autofocus</strong>
            </a>{" "}
            attribute on that element to true. Further, there is an open issue in React regarding
            the usage of autofocus inside the dialog element. Please refer to this{" "}
            <a
              href="https://github.com/facebook/react/issues/23301"
              target="_blank"
              rel="noreferrer"
            >
              link
            </a>{" "}
            & use it accordingly.
          </small>
          <br /> <br />
          <small>
            <b>PS:</b> This storybook&apos;s Show code option doesn&apos;t give the right code
            details. For proper information of the exports of this package, please refer to the{" "}
            <a
              href="https://github.fkinternal.com/Flipkart/MURV/tree/production/packages/modal#readme"
              target="_blank"
              rel="noreferrer"
            >
              <strong>README</strong>
            </a>
            .
          </small>
        </p>
      </ModalsProvider>
    ),
  ],
  render: (args) => {
    const [modalId, , { closeModal, showModal }] = useModal();

    const {
      HeaderProps,
      ContentProps,
      ActionsProps: { actions, ...remainingProps },
      dataTestId,
    } = args;

    const ActionsProps = {
      ...remainingProps,
      actions: actions.map(({ onClick, ...remainingActionProps }) => ({
        ...remainingActionProps,
        onClick: () => {
          closeModal();
          if (onClick) {
            onClick();
          }
        },
      })),
    };

    return (
      <div>
        <button type="button" onClick={showModal} data-testid={`${dataTestId}-show-modal-button`}>
          Show Modal
        </button>
        <ConfirmationModal modalId={modalId} dataTestId={dataTestId}>
          <ConfirmationModal.Header {...HeaderProps} dataTestId={`${dataTestId}-header`} />
          <ConfirmationModal.Content {...ContentProps} dataTestId={`${dataTestId}-content`} />
          <ConfirmationModal.Actions {...ActionsProps} dataTestId={`${dataTestId}-actions`} />
        </ConfirmationModal>
      </div>
    );
  },
  argTypes: {
    HeaderProps: {
      description:
        "The props to be passed on to the Header sub component of the Confirmation Modal. Its type signature is IConfirmationModalHeader. Please refer to the README.md or the types.ts files for more information on it.",
    },
    ContentProps: {
      description:
        "The props to be passed on to the Content sub component of the Confirmation Modal. Its type signature is IConfirmationModalContent. Please refer to the README.md or the types.ts files for more information on it.",
    },
    ActionsProps: {
      description:
        "The props to be passed on to the Actions sub component of the Confirmation Modal. These are futher passed down to the button group component. Its type signature is IModalActions. Please refer to the README.md or the types.ts files for more information on it.",
    },
  },
} satisfies Meta<React.ComponentType<ConfirmationModalArgTypes>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultConfirmationModal: Story = {
  args: {
    HeaderProps: {
      header: "Confirm Action",
    },
    ContentProps: {
      primaryText: "Are you sure you want to know more?",
      secondaryText: "Sometimes too much knowledge can be a curse!",
      tertiaryText: "But it's your choice at the end of the day...",
      link: (
        <Link
          url="?path=/docs/components-modal-confirmationmodal--docs"
          body="Know More"
          linkType="internal"
          // @ts-ignore
          href="path=/docs/components-modal-confirmationmodal--docs"
        />
      ),
    },
    ActionsProps: {
      actions: [
        {
          buttonStyle: "brand",
          buttonType: "tertiary",
          children: "Close",
          onClick: () => console.log("Clicked on Close!!"),
        },
        {
          buttonStyle: "brand",
          buttonType: "primary",
          children: "Submit",
          onClick: () => console.log("Clicked on Submit!!"),
        },
      ],
    },
    dataTestId: "default-story-test-id",
  },
};

export const ConfirmationModalWithoutExtras: Story = {
  args: {
    HeaderProps: DefaultConfirmationModal.args.HeaderProps,
    ContentProps: {
      primaryText: DefaultConfirmationModal.args.ContentProps.primaryText,
      secondaryText: DefaultConfirmationModal.args.ContentProps.secondaryText,
      variant: "warning",
    },
    ActionsProps: DefaultConfirmationModal.args.ActionsProps,
    dataTestId: "modal-without-extras-story-test-id",
  },
};

export const ConfirmationModalWithCloseIconCallback: Story = {
  args: {
    HeaderProps: {
      header: DefaultConfirmationModal.args.HeaderProps.header,
      onCloseIconClick: () => console.log("close icon callback"),
    },
    ContentProps: {
      primaryText: DefaultConfirmationModal.args.ContentProps.primaryText,
      secondaryText: DefaultConfirmationModal.args.ContentProps.secondaryText,
      variant: "warning",
    },
    ActionsProps: DefaultConfirmationModal.args.ActionsProps,
    dataTestId: "modal-without-extras-story-test-id",
  },
};

export const WarningConfirmationModal: Story = {
  args: {
    HeaderProps: DefaultConfirmationModal.args.HeaderProps,
    ContentProps: {
      ...DefaultConfirmationModal.args.ContentProps,
      variant: "warning",
    },
    ActionsProps: DefaultConfirmationModal.args.ActionsProps,
    dataTestId: "warning-modal-story-test-id",
  },
};

export const SuccessConfirmationModal: Story = {
  args: {
    HeaderProps: DefaultConfirmationModal.args.HeaderProps,
    ContentProps: {
      ...DefaultConfirmationModal.args.ContentProps,
      variant: "success",
    },
    ActionsProps: DefaultConfirmationModal.args.ActionsProps,
    dataTestId: "success-modal-story-test-id",
  },
};

export const CautionConfirmationModal: Story = {
  args: {
    HeaderProps: DefaultConfirmationModal.args.HeaderProps,
    ContentProps: {
      ...DefaultConfirmationModal.args.ContentProps,
      variant: "caution",
    },
    ActionsProps: DefaultConfirmationModal.args.ActionsProps,
    dataTestId: "caution-modal-story-test-id",
  },
};

export const ProgressConfirmationModal: Story = {
  args: {
    HeaderProps: DefaultConfirmationModal.args.HeaderProps,
    ContentProps: {
      ...DefaultConfirmationModal.args.ContentProps,
      variant: "progress",
    },
    ActionsProps: DefaultConfirmationModal.args.ActionsProps,
    dataTestId: "caution-modal-story-test-id",
  },
};

export const ConfirmationModalWithoutCloseIcon: Story = {
  args: {
    HeaderProps: {
      header: "Confirmation Modal without Close Icon",
      showCloseIcon: false,
    },
    ContentProps: {
      primaryText: "This is a confirmation modal without a close icon.",
      secondaryText: "Please confirm your action.",
      variant: "warning",
    },
    ActionsProps: {
      actions: [
        {
          text: "Confirm",
          onClick: () => console.log("Confirmed"),
        },
        {
          text: "Cancel",
          onClick: () => console.log("Cancelled"),
        },
      ],
    },
    dataTestId: "confirmation-modal-without-close-icon",
  },
};
