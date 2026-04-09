export type LinkType = "internal" | "external" | "standalone";

export interface LinkComponentProps extends React.HTMLAttributes<HTMLAnchorElement> {
  /**
   * Body of link component, pass this if you  want underline under link
   */
  body?: string;

  /**
   * Caption of link component, pass this instead of body if you dont want underline under link
   */
  caption?: string;

  /**
   * Id for link component
   */
  linkId?: string;

  /**
   * If the link is internal or external
   */
  linkType?: "internal" | "external" | "standalone";

  /**
   * Optional click handler
   */
  onClick?: () => void;

  /**
   * If true disable link
   */
  isDisabled?: boolean;

  /**
   * Id for unit test cases
   */
  dataTestId?: string;

  /**
   * Action on hover of link
   */
  onHover?: () => void;

  /**
   * Path to redirect to
   */
  url?: string;

  /**
   * Styles to pass for link component
   */
  styles?: React.CSSProperties;
}

export interface ILinkStyleProps {
  linkState?: string;
  styles?: React.CSSProperties;
  disabled?: boolean;
  caption?: string;
}
