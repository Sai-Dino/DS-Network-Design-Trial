import { MouseEventHandler } from "react";
import { ISearchProps } from "@murv/search";
import { ButtonGroupProps } from "@murv/button-group";

export interface ProfileDropdownOptions {
  label: string;
  value: string;
}

export interface ProductHeaderProps {
  /**
   * Id for ProductHeader component
   */
  id?: string;
  /**
   * Pass test id for unit tests
   */
  dataTestId?: string;
  /**
   * Image url of the brand
   */
  brandLogoURL?: string;
  /**
   * onClick callback for brand logo
   */
  onBrandLogoClick?: MouseEventHandler<HTMLImageElement> | undefined;
  /**
   * Props to be passed for the search component
   */
  searchProps?: ISearchProps;
  /**
   * Button group props
   */
  buttonGroupProps?: ButtonGroupProps;
  /**
   * For Showing Image in the avatar component
   */
  profileImage?: React.ReactNode;
  /**
   * For Showing Image in the avatar component
   */
  profileDropdown?: {
    name: string;
    options: Array<ProfileDropdownOptions>;
    cb: (selectedValue: string) => void;
  };
  /**
   * Custom header content width
   * @default 1280px
   */
  contentWidth?: string;
}
