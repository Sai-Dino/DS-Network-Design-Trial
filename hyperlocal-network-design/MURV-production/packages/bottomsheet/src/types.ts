/**
 * Interface for the props of the BottomSheet component.
 */
 export interface IBottomSheetProps {
  /**
   * Determines whether the bottom sheet is open or closed.
   * @defaultValue false
   */
  isOpen: boolean;
  
  /**
   * Callback function to toggle the state of the bottom sheet.
   * This function should handle the opening and closing of the bottom sheet.
   */
  setOpen: () => void;
  
  /**
   * A unique test identifier used for testing purposes.
   * This identifier should be unique within the testing environment to facilitate easy identification of the bottom sheet component.
   */
  dataTestId: string;
}

/**
 * Interface for the props of the CloseIcon component.
 */
export interface ICloseIconProps {
  /**
   * Callback function to close the bottom sheet.
   * This function should be triggered when the close icon is clicked or interacted with by the user.
   */
  closeSheet: () => void;
}

/**
 * Interface for the props that contain a unique test identifier.
 */
export interface IDataTestIdProps {
  /**
   * A unique test identifier used for testing purposes.
   * This identifier should be unique within the testing environment to facilitate easy identification of the component.
   */
  dataTestId: string;
}

/**
 * Interface for the props of the BackIcon component.
 */
export interface IBackIconProps {
  /**
   * Callback function to navigate back.
   * This function should handle the action to be performed when the back icon is clicked or interacted with by the user.
   */
  onBack: () => void;
}

/**
 * Type definition for the props of the title component.
 */
export type ITitleProps = IDataTestIdProps & {
  /**
   * The content to be displayed as the title.
   * This content can be a string, JSX elements, or any valid ReactNode.
   */
  children: React.ReactNode;
};

/**
 * Type definition for the props of the BottomSheetHeader component.
 */
export type IBottomSheetHeader = IDataTestIdProps & {
  /**
   * Props for the back icon component.
   * These props include the callback function to handle the action when the back icon is clicked or interacted with.
   */
  backIconProps: IBackIconProps;
  
  /**
   * Props for the title component.
   * These props include the content to be displayed as the title of the bottom sheet header.
   */
  titleProps: ITitleProps;
  
  /**
   * Props for the close icon component.
   * These props include the callback function to close the bottom sheet when the close icon is clicked or interacted with.
   */
  closeIconProps: ICloseIconProps;
};

/**
 * Type definition for the props of the BottomSheetContent component.
 */
export type IBottomSheetContent = IDataTestIdProps & {
  /**
   * The content to be displayed within the bottom sheet.
   * This content can include text, images, other components, or any valid ReactNode.
   */
  children: React.ReactNode;
};
