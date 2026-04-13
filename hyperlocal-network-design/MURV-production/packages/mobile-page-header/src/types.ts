import { ISearchProps } from "@murv/search";
import { ButtonProps } from "@murv/button";
import { ButtonGroupProps } from "@murv/button-group";
import { ToggleProps } from "@murv/toggle";
import { MouseEventHandler } from "react";

export interface MobilePageHeaderProps {
  /**
   * Id for MobilePageHeader component
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
   * Title of the page (Will be shown if brand logo is not present)
   */
  pageTitle?: string;
  /**
   * Subtitle of the page (Will be shown if brand logo is not present)
   */
  pageSubTitle?: string;
  /**
   * Props to be passed for the search component
   */
  searchProps?: ISearchProps;
  /**
   * Back Button props
   */
  backButtonProps?: ButtonProps;
  /**
   * Button group props
   */
  buttonGroupProps?: ButtonGroupProps;
  /**
   * Toggle props
   */
  toggleProps?: ToggleProps;
}
