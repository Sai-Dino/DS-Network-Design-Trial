import { CSSProperties, FC, ReactNode } from "react";

/**
 * This is the type Tof the Card component which is a function component accepting CardProps
 * It also has Header and Body as Sub components
 */
export interface ICardComponent extends FC<ICardProps & IAccessibilityProps> {
  Header: TCardHeaderComponent;
  Body: TCardBodyComponent;
}

export type TCardHeaderComponent = FC<ICardHeaderProps & IAccessibilityProps> &
  IHeaderSubComponents;
export type TCardTagComponent = FC<ICardSlotProps & IAccessibilityProps>;
export type TCardMenuComponent = FC<ICardSlotProps & IAccessibilityProps>;
export type TCardBodyComponent = FC<ICardClickableSlotProps> & IBodySubComponents;
export type TCardImageComponent = FC<ICardImageProps & IAccessibilityProps>;
export type TCardVideoComponent = FC<ICardVideoProps & IAccessibilityProps>;
export type TCardTextBlockComponent = FC<ICardTextBlockProps & IAccessibilityProps>;
export type TCardCarousalComponent = FC<ICardSlotProps & IAccessibilityProps>;
export type TCardLinkComponent = FC<ICardSlotProps & IAccessibilityProps>;
export type TCardVerticalSlotComponent = FC<ICardClickableSlotProps & IAccessibilityProps> &
  IVerticalPossibleItemTypes;
export type TCardHorizontalSlotComponent = FC<ICardClickableSlotProps & IAccessibilityProps> &
  IHorizontalPossibleItemTypes;
export type TCardHorizontalComponent = FC<ICardClickableSlotProps & IAccessibilityProps> &
  IHorizontalItemsSubComponents;
export type TCardVerticalComponent = FC<ICardClickableSlotProps & IAccessibilityProps> &
  IVerticalItemsSubComponents;
/**
 * These are the sub components of Card.Header
 * It has Badge, Icon and MenuElement as Sub components
 */
export interface IHeaderSubComponents {
  Icon: TCardImageComponent;
  Tag: TCardTagComponent;
  MenuElement: TCardMenuComponent;
}

/**
 * These are the sub components of Card.Body
 * It has HorizontalItem and VerticalItem as Sub components
 */
export interface IBodySubComponents {
  HorizontalItem: TCardHorizontalComponent;
  VerticalItem: TCardVerticalComponent;
}

/**
 * These are the sub components of Card.Body.HorizontalItem
 * It has Left, Middle, and Right as Sub components. Middle is mandatory
 */
export interface IHorizontalItemsSubComponents {
  Slot: TCardHorizontalSlotComponent;
}

/**
 * These are the sub components of Card.Body.VerticalItem
 * It has Top and Bottom as Sub components. Top is mandatory
 */
export interface IVerticalItemsSubComponents {
  Slot: TCardVerticalSlotComponent;
}

/**
 * These are the possible sub components of HorizontalItem
 * It has Thumbnail, TextBlock, Icon, and Link as Sub components
 */
export interface IHorizontalPossibleItemTypes {
  Thumbnail: TCardImageComponent;
  TextBlock: TCardTextBlockComponent;
  Icon: TCardImageComponent;
  Link: TCardLinkComponent;
}

/**
 * These are the possible sub components of VerticalItem
 * It has Image, Video, TextBlock, and Carousal as Sub components
 */
export interface IVerticalPossibleItemTypes {
  Image: TCardImageComponent;
  Video: TCardVideoComponent;
  TextBlock: TCardTextBlockComponent;
  Carousal: TCardCarousalComponent;
}

/**
 * Additional accessibility props to be added to all components
 * @param role: string - The role attribute for accessibility
 * @param ariaLabel: string - The aria-label attribute for accessibility
 * @param ariaDescribedby: string - The aria-describedby attribute for accessibility
 * @param ariaHidden: boolean - The aria-hidden attribute for accessibility
 * @param tabIndex: number - The tabIndex attribute for accessibility
 */
export interface IAccessibilityProps {
  role?: string;
  ariaLabel?: string;
  ariaDescribedby?: string;
  ariaHidden?: boolean;
  tabIndex?: number;
}

/**
 * These are the props which are accepted by Card component
 * @param id: string - This is mandatory. It is used to identify the card. It is also used as the key for the card
 * @param interactable: boolean - If false, It will not honor onClick and will not show any interaction states like hovered, focussed, disabled etc.
 * @param disabled: boolean - If true, It will not honor onClick and will show the disabled state. If false, it will honor onClick and will not show the disabled state
 * @param onClick: (id: string) => void - If interactable is true,  and disabled false, then this callback will be called when the uber level card is clicked
 * @param className: string - This is the class name
 * @param containerStyles: CSSProperties - This is the style object
 */
export interface ICardProps {
  id: string;
  testId: string;
  interactable?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  containerStyles?: CSSProperties;
}

/**
 * These are the props which are accepted by   Card.Header component
 * @param icon: CardSlotProps - If provided, it will show the icon on the left side of the title
 * @param title: string - The title of the card header. This is mandatory
 * @param isActionable: boolean - If true, it will show the three dots on the right side of the header
 * @param className: string - This is the class name
 * @param containerStyles: CSSProperties - This is the style object
 */
export interface ICardHeaderProps extends ICardSlotProps {
  title: string;
  isActionable?: boolean;
}

/**
 * These are the props which are accepted by Card.Body component
 * @param className: string - This is the class name
 * @param containerStyles: CSSProperties - This is the style object
 * @param onClick: () => void - This is the callback which will be called when the media is clicked
 */
export interface ICardClickableSlotProps extends ICardSlotProps {
  onClick?: () => void;
}

/**
 * These are the props which are accepted by any Card Element Slot
 * @param className: string - This is the class name
 * @param containerStyles: CSSProperties - This is the style object
 */
export interface ICardSlotProps {
  className?: string;
  containerStyles?: CSSProperties;
}

/**
 * These are the props which are accepted by any Card Media Slot
 * @param src: string - This is the source of the media
 * @param alt: string - This is the alt text of the media
 * @param svg: ReactNode - This is the svg which will be shown as the media
 * @param className: string - This is the class name
 * @param containerStyles: CSSProperties - This is the style object
 * @param onClick: () => void - This is the callback which will be called when the media is clicked
 */
export interface ICardImageProps extends ICardSlotProps {
  src?: string;
  alt?: string;
  svg?: ReactNode;
  onClick?: () => void;
}

/**
 * These are the props which are accepted by any Card Video Slot
 * @param src: string - This is the source of the video
 * @param alt: string - This is the alt text of the video
 * @param className: string - This is the class name
 * @param containerStyles: CSSProperties - This is the style object
 * @param onClick: () => void - This is the callback which will be called when the video is clicked
 * @param playIcon: ReactNode - This is the icon which will be shown on the video
 * @param playIconContainerStyles: CSSProperties - This is the style object which will be applied to the play icon container
 * @param playIconStyles: CSSProperties - This is the style object which will be applied to the play icon
 * @param playIconClassName: string - This is the class name which will be applied to the play icon
 * @param playIconContainerClassName: string - This is the class name which will be applied to the play icon container
 * @param videoContainerStyles: CSSProperties - This is the style object which will be applied to the video container
 * @param videoContainerClassName: string - This is the class name which will be applied to the video container
 * @param videoStyles: CSSProperties - This is the style object which will be applied to the video
 * @param videoClassName: string - This is the class name which will be applied to the video
 * @param videoControls: boolean - If true, it will show the controls on the video
 * @param videoAutoPlay: boolean - If true, it will start playing the video automatically
 * @param videoLoop: boolean - If true, it will start playing the video in loop
 * @param videoMuted: boolean - If true, it will mute the video
 * @param videoPlaysInline: boolean - If true, it will play the video inline
 * @param videoPreload: "auto" | "metadata" | "none" - This is the preload attribute of the video
 * @param videoPoster: string - This is the poster of the video
 * @param videoWidth: string - This is the width of the video
 * @param videoHeight: string - This is the height of the video
 */
export interface ICardVideoProps extends ICardImageProps {
  playIcon?: ReactNode;
  playIconContainerStyles?: CSSProperties;
  playIconStyles?: CSSProperties;
  playIconClassName?: string;
  playIconContainerClassName?: string;
  videoContainerStyles?: CSSProperties;
  videoContainerClassName?: string;
  videoStyles?: CSSProperties;
  videoClassName?: string;
  videoControls?: boolean;
  videoAutoPlay?: boolean;
  videoLoop?: boolean;
  videoMuted?: boolean;
  videoPlaysInline?: boolean;
  videoPreload?: "auto" | "metadata" | "none";
  videoPoster?: string;
  videoWidth?: string;
  videoHeight?: string;
  trackSrc?: string;
  onClick?: () => void;
}

/**
 * These are the props which are accepted by any Card Text Block Slot
 * @param primaryLine- This is the title of the text block
 * @param secondaryLine- This is the subtitle of the text block
 * @param tertiaryLine - This is the third line of the text block
 * @param className: string - This is the class name
 * @param containerStyles: CSSProperties - This is the style object
 * @param onClick: () => void - This is the callback which will be called when the text block is clicked
 */
export interface ICardTextBlockProps extends ICardSlotProps {
  primaryLine: string | JSX.Element;
  secondaryLine?: string | JSX.Element;
  tertiaryLine?: string | JSX.Element;
  onClick?: () => void;
}

export interface ICardContextProps {
  id?: string;
  testId?: string;
  interactable?: boolean;
  disabled?: boolean;
}

export interface IStyledCardProps extends ICardProps {}
