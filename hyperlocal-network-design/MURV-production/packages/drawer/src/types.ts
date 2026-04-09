import { FC, ReactNode } from "react";
import { ButtonGroupProps } from "packages/button-group/src/types";

export type THeaderProps = {
  /**
   * Its optional to pass the icon name.
   * Used for the Drawer header title icon,
   */
  icon?: React.ReactNode;
  /**
   * Primary title of the Drawer header
   */
  title: string;
  /**
   * Secondary title of the Drawer header
   */
  subTitle?: string;
};

export type TFooterProps = {
  /**
   * Button group props for the footer
   */
  buttonGroupProps?: ButtonGroupProps;
};

export type TContentProps = {
  /**
   * Content to be displayed in the drawer
   */
  children: ReactNode;
};

/**
 * This is the type Tof the Drawer component which is a function component accepting DrawerProps
 * It also has Header, Content & Footer as Sub components
 */
export interface IDrawerComponent extends FC<TDrawer> {
  Header: FC<THeaderProps>;
  Content: FC<TContentProps>;
  Footer: FC<TFooterProps>;
}

export type TDrawer = TDataTestIdProps & {
  id: string;
  show: boolean;
  drawerContainerWidth: number;
  drawerContainerMaxWidth?: number;
  closeDrawer: () => void;
  /**
   * When true, clicking outside the drawer content will close the drawer
   */
  shouldCloseOnOverlayClick?: boolean;
  /**
   * Children components (Header, Content, Footer)
   */
  children: ReactNode;
};

export type TDataTestIdProps = {
  dataTestId?: string;
};

export type TDrawerContext = TDataTestIdProps & {
  id: string;
  closeDrawer: () => void;
};
