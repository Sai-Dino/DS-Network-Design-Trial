import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Link } from "@murv/link";
import Carousel from "@murv/carousel";
import { LaunchModal } from "./components/launch-modal";
import { useModal } from "./hooks/useModal";
import { ModalsProvider } from "./provider/ModalsProvider";
import {
  ILaunchModalHeader,
  ILaunchModalMultimediaContent,
  ILaunchModalTextListContent,
  IModalActions,
} from "./types";

type LaunchModalArgTypes = {
  HeaderProps: ILaunchModalHeader;
  ContentProps:
    | ILaunchModalMultimediaContent
    | ILaunchModalTextListContent
    | ILaunchModalMultimediaContent[];
  ActionsProps: IModalActions;
  dataTestId: string;
};

const meta = {
  title: "Components/Modal/LaunchModal",
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

    const renderContent = () => {
      if (Array.isArray(ContentProps)) {
        return (
          // TODO: to figure out how to power this width & height.
          <Carousel cardWidth={400} cardHeight={400} testId={`${dataTestId}-carousel`}>
            {ContentProps.map((content, index) => (
              <LaunchModal.Content.Multimedia
                {...content}
                dataTestId={`${dataTestId}-multimedia-content-${index}`}
              />
            ))}
          </Carousel>
        );
      }
      if ("textList" in ContentProps) {
        return (
          <LaunchModal.Content.TextList
            {...ContentProps}
            dataTestId={`${dataTestId}-textlist-content`}
          />
        );
      }
      return (
        <LaunchModal.Content.Multimedia
          {...ContentProps}
          dataTestId={`${dataTestId}-multimedia-content`}
        />
      );
    };

    return (
      <div>
        <button type="button" onClick={showModal} data-testid={`${dataTestId}-show-modal-button`}>
          Show Modal
        </button>
        <LaunchModal modalId={modalId} dataTestId={dataTestId}>
          <LaunchModal.Header {...HeaderProps} dataTestId={`${dataTestId}-header`} />
          <LaunchModal.Content dataTestId={`${dataTestId}-content`}>
            {renderContent()}
          </LaunchModal.Content>
          <LaunchModal.Actions {...ActionsProps} dataTestId={`${dataTestId}-actions`} />
        </LaunchModal>
      </div>
    );
  },
  argTypes: {
    HeaderProps: {
      description:
        "The props to be passed on to the Header sub component of the Launch Modal. Its type signature is ILaunchModalHeader. Please refer to the README.md or the types.ts files for more information on it.",
    },
    ContentProps: {
      description: `The props to be passed on to the various supported sub types of the Launch Modal content. 
        The type ILaunchModalTextListContent corresponds to the LaunchModal.Content.TextList sub component.
        The type ILaunchModalMultimediaContent corresponds to the LaunchModal.Content.Multimedia sub component.
        The LaunchModal.Content also accepts a Carousel component with a list of LaunchModal.Content.Multimedia children.
        Please refer to the README.md or the types.ts files for more information on these types.
        `,
    },
    ActionsProps: {
      description:
        "The props to be passed on to the Actions sub component of the Launch Modal. These are futher passed down to the button group component. Its type signature is IModalActions. Please refer to the README.md or the types.ts files for more information on it.",
    },
  },
} satisfies Meta<React.ComponentType<LaunchModalArgTypes>>;

export default meta;
type Story = StoryObj<typeof meta>;

const SAMPLE_IMAGE_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgwIiBoZWlnaHQ9IjIyNSIgdmlld0JveD0iMCAwIDI4MSAyMDQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wLjU2MjUgOEMwLjU2MjUgMy44NTc4NiAzLjkyMDM2IDAuNSA4LjA2MjUgCjAuNUgyNzIuMDYyQzI3Ni4yMDUgMC41IDI3OS41NjIgMy44NTc4NyAyNzkuNTYyIDhWMTk2QzI3OS41NjIgMjAwLjE0MiAyNzYuMjA1IDIwMy41IDI3Mi4wNjIgMjAzLjVIOC4wNjI1QzMuOTIwMzYgMjAzLjUgMC41NjI1IDIwMC4xNDIgMC41NjI1IDE5NlY4WiIgZmlsbD0iI0FCQzhGRiIgc3Ryb2tlPSIjRUVFRUVFIi8+Cjwvc3ZnPgo=";

export const SimpleImageBasedLaunchModal: Story = {
  args: {
    HeaderProps: {
      header: "Welcome to Flipkart Promotions!",
      subHeader: "The one stop dashboard to manage all offers on your products.",
    },
    ContentProps: {
      resourceType: "image",
      resourceUrl: SAMPLE_IMAGE_DATA_URL,
      resourceAltText: "Increase your growth by accepting Price recommendations.",
      primaryText: "Welcome to Price Recommendations!",
      secondaryText: "Apply prices recommended by us to get maximum busniness!",
      tertiaryText: "Explore the page to know more!",
      link: (
        <Link
          url="?path=/docs/components-modal-launchmodal--docs"
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
    dataTestId: "simple-image-content-story-test-id",
  },
};

export const SimpleVideoBasedLaunchModal: Story = {
  args: {
    HeaderProps: SimpleImageBasedLaunchModal.args.HeaderProps,
    ContentProps: {
      ...SimpleImageBasedLaunchModal.args.ContentProps,
      resourceType: "video",
      resourceUrl: "https://static-assets-web.flixcart.com/fk-sp-static/MURV/BigBuckBunny.mp4",
    },
    ActionsProps: SimpleImageBasedLaunchModal.args.ActionsProps,
    dataTestId: "simple-video-content-story-test-id",
  },
};

export const SimpleTextListBasedLaunchModal: Story = {
  args: {
    HeaderProps: SimpleImageBasedLaunchModal.args.HeaderProps,
    ContentProps: {
      textList: [
        {
          icon: "hexagon",
          primaryText: "Earn More Money!",
          secondaryText: "Up to you whether its by hook or crook",
        },
        {
          icon: "hexagon",
          primaryText: "Earn More Money!",
          secondaryText: "Up to you whether its by hook or crook",
        },
        {
          icon: "hexagon",
          primaryText: "Earn More Money!",
          secondaryText: "Up to you whether its by hook or crook",
        },
        {
          icon: "hexagon",
          primaryText: "Earn More Money!",
          secondaryText: "Up to you whether its by hook or crook",
        },
      ],
    },
    ActionsProps: SimpleImageBasedLaunchModal.args.ActionsProps,
    dataTestId: "simple-textlist-content-story-test-id",
  },
};

export const TextListWithRightAlignedIconBasedLaunchModal: Story = {
  args: {
    HeaderProps: SimpleTextListBasedLaunchModal.args.HeaderProps,
    ContentProps: {
      iconPosition: "right",
      // @ts-ignore
      textList: SimpleTextListBasedLaunchModal.args.ContentProps.textList,
    },
    ActionsProps: SimpleTextListBasedLaunchModal.args.ActionsProps,
    dataTestId: "simple-textlist-right-icon-content-story-test-id",
  },
};

export const CarouselBasedLaunchModal: Story = {
  args: {
    HeaderProps: SimpleImageBasedLaunchModal.args.HeaderProps,
    // @ts-ignore
    ContentProps: [
      ...Array(5)
        .fill("")
        .map(() => SimpleImageBasedLaunchModal.args.ContentProps),
    ],
    ActionsProps: SimpleImageBasedLaunchModal.args.ActionsProps,
    dataTestId: "carousel-content-story-test-id",
  },
};
