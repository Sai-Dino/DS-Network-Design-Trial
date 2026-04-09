# Modal Component

This package contains the code for creating modal based experiences as part of the MURV library. This document has the following sections,

- [Usage](#usage)
  - [ModalsProdivder](#modalsprovider)
  - [useModal](#usemodal)
  - [ConfirmationModal](#confirmationmodal)
  - [LaunchModal](#launchmodal)
    - [LaunchModal with TextList content](#launchmodal-with-text-list-content)
    - [LaunchModal with Multimedia content](#launchmodal-with-multimedia-content)
    - [LaunchModal with Multimedia carousel content](#launchmodal-with-multimedia-carousel-content)
- [Props Types](#props--arguments)
  - [Common Prop Types](#common-prop-types)
  - [ConfirmationModal Prop Types](#confirmationmodal-prop-types)
  - [LaunchModal Prop Types](#launchmodal-prop-types)
- [Links](#links)

## Usage

This package primarily exports the following:

- ModalsProvider
- useModal
- LaunchModal
- ConfirmationModal

### ModalsProdivder

ModalsProvider is a context provider that needs to be added at the root of your project. Only modals elements which have this provider as an ancestor will eventually work.

```tsx
// App.tsx or Root.tsx or Layout.tsx
import React from "react";
import { ThemeProdivder } from "styled-components";
import { ModalsProvider } from "@murv/modal";

export const App: React.FC = ({ children }) => {
  return (
    <ThemeProvider>
      <ModalsProvider>{children}</ModalsProvider>
    </ThemeProvider>
  );
};
```

### useModal

The hook useModal connects the modals that you render in your component's jsx to the ModalsProvider and coordinates with it for displaying and closing the modal.

```tsx
// MyComponent.tsx
import React from "react";

export const MyComponent: React.FC = () => {
  /** The useModal hook returns a constant array with 3 elements.
   *  The first element of the array is the modalId. This is a unique id that is to be assosiated with your modal instance.
   *  The other elements are the state & actions associated with your modal. The are further described below.
   */
  const [modalId, modalState, modalActions] = useModal();
  /**
   * The modalState consists of 2 fields, isVisible & isInStack.
   * isVisible indicates of the modal is currently being shown to the user.
   * isInStack indicates if the modal is the stack to be shown to the user, but is currently not being shown as there is some other modal above it.
   */
  const { isVisible, isInStack } = modalState;
  /**
   * The modalActions consist of 2 self explanatory methods, showModal & closeModal.
   */
  const { showModal, closeModal } = modalActions;

  return <div></div>;
};
```

Please note that the modalId returned by the useModal hook must be passed on to the Modal rendered by you. Otherwise the modal will not work as expected.

### ConfirmationModal

ConfirmationModal is one of the types of modals present in our MURV library. You visit the figma link for more info on how it looks and what other types are available. For building the ConfirmationModal experience, we follow the composition approach and hence the ConfirmationModal export also exposes further sub components. You can understand this from the example below.

```tsx
// MyComponent.tsx
import React from "react";
import { useModal, ConfirmationModal } from "@murv/modal";

export const MyComponent: React.FC = () => {
    const [modalId, modalState, modalActions: { showModal, closeModal }] = useModal();

    const submit = () => {
        console.log("Clicked on Submit!!");
        closeModal();
    }

    return (
        <div>
            <button onClick={showModal}>Show Modal</button>
            <ConfirmationModal modalId={modalId}>
                <ConfirmationModal.Header header="Confirm Action"/>
                <ConfirmationModal.Content
                    primaryText="Are you sure you want to know more?"
                    secondaryText="Sometimes too much knowledge can be a curse!"
                    tertiaryText="But it's your choice at the end of the day..."
                    link={<Link
                        url="?path=/docs/components-modal-confirmationmodal--docs"
                        body="Know More"
                        linkType="internal"
                        />}
                />
                <ConfirmationModal.Actions
                    actions={[
                        {
                            buttonStyle:  "brand",
                            buttonType: "tertiary",
                            children: "Close",
                            onClick: closeModal
                        },
                        {
                            buttonStyle: "brand",
                            buttonType: "primary",
                            children: "Submit",
                            onClick: submit ,
                        }
                    ]}/>
            </ConfirmationModal>
        </div>
    )
}
```

In the above example, it is very important that the modalId returned by the hook is passed to the ConfirmationModal as a prop. Also, the example component MyComponent must be a descendant of the ModalsProvider.

### LaunchModal

LaunchModal is one of the types of modals present in our MURV library. You visit the figma link for more info on how it looks and what other types are available. For building the LaunchModal experience, we follow the composition approach and hence the ConfirmationModal export also exposes further sub components. You can understand this from the example below.

In the all below examples, it is very important that the modalId returned by the hook is passed to the LaunchModal as a prop. Also, the example component MyComponent must be a descendant of the ModalsProvider.

#### LaunchModal with TextList content

```tsx
// MyComponent.tsx
import React from "react";
import { useModal, LaunchModal } from "@murv/modal";

export const MyComponent: React.FC = () => {
    const [modalId, modalState, modalActions: { showModal, closeModal }] = useModal();

    const submit = () => {
        console.log("Clicked on Submit!!");
        closeModal();
    }

    return (
        <div>
            <button onClick={showModal}> Show Modal </button>
            <LaunchModal modalId={modalId}>
                <LaunchModal.Header
                    header="Welcome to Flipkart Promotions!"
                    subHeader="The one stop dashboard to manage all offers on your products."/>
                <LaunchModal.Content>
                    <LaunchModal.Content.TextList
                        textList={[
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
                        ]}
                        iconPosition="left"
                    />
                </LaunchModal.Content>
                <LaunchModal.Actions
                    actions={[
                        {
                            buttonStyle:  "brand",
                            buttonType: "tertiary",
                            children: "Close",
                            onClick: closeModal
                        },
                        {
                            buttonStyle: "brand",
                            buttonType: "primary",
                            children: "Submit",
                            onClick: submit ,
                        }
                    ]}/>
            </LaunchModal>
        </div>
    )
}
```

#### LaunchModal with Multimedia content

```tsx
// MyComponent.tsx
import React from "react";
import { useModal, LaunchModal } from "@murv/modal";

export const MyComponent: React.FC = () => {
    const [modalId, modalState, modalActions: { showModal, closeModal }] = useModal();

    const submit = () => {
        console.log("Clicked on Submit!!");
        closeModal();
    }

    return (
        <div>
            <button onClick={showModal}> Show Modal </button>
            <LaunchModal modalId={modalId}>
                <LaunchModal.Header
                    header="Welcome to Flipkart Promotions!"
                    subHeader="The one stop dashboard to manage all offers on your products."/>
                <LaunchModal.Content>
                    <LaunchModal.Content.Multimedia
                        resourceType="image"
                        resourceUrl="https://static-assets-web.flixcart.com/fk-sp-static/images/outage-graphics.svg"
                        resourceAltText="Increase your growth by accepting Price recommendations."
                        primaryText="Welcome to Price Recommendations!"
                        secondaryText="Apply prices recommended by us to drive maximum busniness on your products!"
                        tertiaryText="Explore the page to know more about Price recommendations & its features"
                        link={
                            <Link
                            url="?path=/docs/components-modal-launchmodal--docs"
                            body="Know More"
                            linkType="internal"
                            />
                        }
                    />
                </LaunchModal.Content>
                <LaunchModal.Actions
                    actions={[
                        {
                            buttonStyle:  "brand",
                            buttonType: "tertiary",
                            children: "Close",
                            onClick: closeModal
                        },
                        {
                            buttonStyle: "brand",
                            buttonType: "primary",
                            children: "Submit",
                            onClick: submit ,
                        }
                    ]}/>
            </LaunchModal>
        </div>
    )
}
```

#### LaunchModal with Multimedia Carousel content

```tsx
// MyComponent.tsx
import React from "react";
import { Carousel } from "@murv/carousel";
import { useModal, LaunchModal } from "@murv/modal";

export const MyComponent: React.FC = () => {
    const [modalId, modalState, modalActions: { showModal, closeModal }] = useModal();

    const submit = () => {
        console.log("Clicked on Submit!!");
        closeModal();
    }

    return (
        <div>
            <button onClick={showModal}> Show Modal </button>
            <LaunchModal modalId={modalId}>
                <LaunchModal.Header
                    header="Welcome to Flipkart Promotions!"
                    subHeader="The one stop dashboard to manage all offers on your products."/>
                <LaunchModal.Content>
                    <Carousel>
                        <LaunchModal.Content.Multimedia
                            resourceType="image"
                            resourceUrl="https://static-assets-web.flixcart.com/fk-sp-static/images/outage-graphics.svg"
                            resourceAltText="Increase your growth by accepting Price recommendations."
                            primaryText="Welcome to Price Recommendations!"
                            secondaryText="Apply prices recommended by us to drive maximum busniness on your products!"
                            tertiaryText="Explore the page to know more about Price recommendations & its features"
                            link={
                                <Link
                                url="?path=/docs/components-modal-launchmodal--docs"
                                body="Know More"
                                linkType="internal"
                                />
                            }
                        />
                        <LaunchModal.Content.Multimedia
                            resourceType="image"
                            resourceUrl="https://static-assets-web.flixcart.com/fk-sp-static/images/outage-graphics.svg"
                            resourceAltText="Increase your growth by accepting Price recommendations."
                            primaryText="Welcome to Price Recommendations!"
                            secondaryText="Apply prices recommended by us to drive maximum busniness on your products!"
                            tertiaryText="Explore the page to know more about Price recommendations & its features"
                            link={
                                <Link
                                url="?path=/docs/components-modal-launchmodal--docs"
                                body="Know More"
                                linkType="internal"
                                />
                            }
                        />
                    </Carousel>
                </LaunchModal.Content>
                <LaunchModal.Actions
                    actions={[
                        {
                            buttonStyle:  "brand",
                            buttonType: "tertiary",
                            children: "Close",
                            onClick: closeModal
                        },
                        {
                            buttonStyle: "brand",
                            buttonType: "primary",
                            children: "Submit",
                            onClick: submit ,
                        }
                    ]}/>
            </LaunchModal>
        </div>
    )
}
```

## Prop Types

### Common Prop Types

```typescript
/**
 * This is derived from the prop type of the ButtonGroup component to which they are passed down to.
 */
export interface ButtonProps {
  /**
   * label can be used here
   */
  children?: React.ReactText;
  /**
   * define the type of button, default: "submit"
   */
  type?: keyof typeof BtnType;
  /**
   * How large should the button be?
   */
  size?: keyof typeof ButtonSize;
  /**
   * button Class to access the element
   */
  className?: string;
  /**
   * Optional click handler
   */
  onClick?: () => void;
  /**
   * To disable the button to access
   */
  disabled?: boolean;
  /**
   * Pointer to test the element
   */
  dataTestId?: string;
  /**
   * Declare the type of the Button
   */
  buttonType?: ButtonType;
  /**
   * Declare the style of the Button
   */
  buttonStyle?: ButtonStyle;
  /**
   * Declare the Prefix icon if needed
   */
  prefixIcon?: string;
  /**
   * Declare the Suffix icon if needed
   */
  suffixIcon?: string;
  /**
   * Declare the Suffix cb
   */
  suffixCallback?: () => void | null;
  /**
   * Display loader on data loading
   */
  isLoading?: boolean;
}

/**
 * All exported components accept the dataTestId prop. This can be leveraged for testing purposes.
 */
export type IDataTestIdProps = {
  dataTestId?: string;
};

/**
 * The prop type of the actions sub component for both LaunchModal & ConfirmationModal.
 */
type IModalActions = IDataTestIdProps & {
  /**
   * A list of buttons to be shown in the modal footer.
   */
  actions: ButtonProps[];
};
/**
 * The common prop type for all the main / root modal components, i.e ConfirmationModal & LaunchModal
 */
export type IModal = IDataTestIdProps & {
  modalId: string;
  onClose?: () => void;
};
```

### ConfirmationModal Prop Types

```typescript
/**
 * The prop type of the Header sub component of ConfirmationModal.
 */
type IConfirmationModalHeader = IDataTestIdProps & {
  header: string;
};

/**
 * The prop type of the Content sub component of ConfirmationModal.
 */
type IConfirmationModalContent = IDataTestIdProps & {
  variant?: (typeof CONFIRMATION_MODAL_CONTENT_VARIANTS)[keyof typeof CONFIRMATION_MODAL_CONTENT_VARIANTS];
  primaryText: string;
  secondaryText: string;
  tertiaryText?: string;
  // TODO: Restrict to only react nodes created using DLS Link component.
  link?: JSX.Element;
};
```

### LaunchModal Prop Types

```typescript
/**
 * The prop type of the Header sub component of LaunchModal.
 */
export type ILaunchModalHeader = IDataTestIdProps & {
  header: string;
  subHeader: string;
};

/**
 * The prop type of the Multimedia type content sub component of ConfirmationModal.
 */
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

/**
 * The prop type of the TextList type content sub component of ConfirmationModal.
 */
export type ILaunchModalTextListContent = IDataTestIdProps & {
  textList: {
    primaryText: string;
    secondaryText: string;
    icon: string;
  }[];
  iconPosition?: (typeof TEXTLIST_CONTENT_ICON_POSITIONS)[keyof typeof TEXTLIST_CONTENT_ICON_POSITIONS];
};
```

## Links

- [The Modal component figma](https://www.figma.com/file/o2VrJT48UsU1nlbjFkkNp2/MURV-Master-Components?node-id=2291%3A76012&mode=dev)
- [The Modal component solutioning document](https://docs.google.com/document/d/1UaVrk5_NN5kRntXm_1yv2ehlQIZadbQE0JPzdGFjozg/edit#heading=h.27tgn8v8tq9)
- [The Modal components' solutioning review open points & MoMs](https://docs.google.com/document/d/1k0GlvrnYqyFgLm6aMgik414UkRFJNvk4BDYzuKSj2u0/edit#heading=h.vuhmy4lsgie)
- [HTML5 Dialog element specification](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog#accessibility_concerns)
- [WAI ARIA specification for the Modal pattern implementation](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/)
