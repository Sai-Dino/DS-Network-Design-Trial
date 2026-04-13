import { BreadcrumbProps } from "@murv/breadcrumb";
import { TagProps } from "@murv/tag";
import { ButtonProps } from "@murv/button";
import { ButtonGroupProps } from "@murv/button-group";
import { ISearchProps } from "@murv/search";
// TODO: Remove once Page Filter Bar is implemented
export interface FilterProps {}

export interface PageHeaderProps {
  /**
   * Id for Page Header component
   */
  id?: string;
  /**
   * Pass test id for unit tests
   */
  dataTestId?: string;
  /**
   * Page Title
   */
  pageHeaderText: string;
  /**
   * Breadcrumb props
   */
  breadcrumbProps: BreadcrumbProps;
  /**
   * Array of Tag props
   */
  tags?: TagProps[];
  /**
   * Pass the filter props
   */
  filterProps?: FilterProps;
  /**
   * Button group props
   */
  buttonProps?: ButtonProps;
  /**
   * Button group props
   */
  buttonGroupProps?: ButtonGroupProps;
  /**
   * Search props
   */
  searchProps?: ISearchProps;
}
