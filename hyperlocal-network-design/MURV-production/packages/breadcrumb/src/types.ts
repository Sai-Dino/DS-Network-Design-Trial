import { LinkComponentProps } from "@murv/link";

export interface BreadcrumbProps {
  /**
   * Id for breadcrumb component
   */
  id?: string;
  /**
   * Pass test id for unit tests
   */
  dataTestId?: string;
  /**
   * Links to all the routes that need to be rendered
   */
  routes?: Array<LinkComponentProps>;
  /**
   * Home icon for the root breadcrumb
   */
  baseIconId?: string;
  /**
   * Flag to show/hide base icon
   */
  showBaseIcon?: boolean;
  /**
   * Separator Icon id for the breadcrumbs
   */
  separatorIconId?: string;
  /**
   * Flag to show/hide separator icon
   */
  showSeparatorIcon?: boolean;
  /**
   * If links are more than 4 links need to be truncated
   */
  truncateIconId?: string;
}
