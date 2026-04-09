export enum ButtonSize {
  small = "small",
  large = "large",
}

export enum BtnType {
  submit = "submit",
  reset = "reset",
  button = "button",
}

export enum BtnStyleType {
  primary = "primary",
  secondary = "secondary",
  tertiary = "tertiary",
  inline = "inline",
  ascent = "ascent",
  floating = "floating",
}

type ButtonType = keyof typeof BtnStyleType;
type ButtonStyle = ButtonType extends "primary"
  ? "brand"
  : ButtonType extends "ascent" | "floating"
    ? never
    : "brand" | "danger" | "neutral";
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
  PrefixIcon?: React.ComponentType<{ color: string }>; // We are using React.ComponentType instead of React.ElementType because we are expecting icons to be JSX element instead of primitives like number, null, undefined etc.
  /**
   * Declare the Suffix icon if needed
   */
  SuffixIcon?: React.ComponentType<{ color: string }>; // We are using React.ComponentType instead of React.ElementType because we are expecting icons to be JSX element instead of primitives like number, null, undefined etc.
  /**
   * Declare the Suffix cb
   */
  suffixCallback?: () => void | null;
  /**
   * Display loader on data loading
   */
  isLoading?: boolean;
}

// refer packages/button/src/utils/index.tsx for function definition.
type MapButtonBGColorProps = (
  type: string,
  style: string,
  state?: string,
  disabled?: boolean,
  isLoading?: boolean,
) => string;
type MapButtonBorderColorProps = (
  type: string,
  style: string,
  state: string,
  disabled: boolean,
) => string;
type MapButtonTextColorProps = (type: string, style: string, disabled: boolean) => string;
type MapBtnSizeProps = (type: string) => string;
type RenderContainerBorder = (type: string) => boolean;

export interface StyledButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  buttonType: keyof typeof BtnStyleType;
  buttonStyle: ButtonStyle;
  buttonSize: keyof typeof ButtonSize;
  assignWidth: boolean;
  isLoading: boolean;
  onHover?: () => void;
  onPressed?: () => void;
  buttonBGColor: MapButtonBGColorProps;
  buttonBorderColor: MapButtonBorderColorProps;
  buttonTextColor: MapButtonTextColorProps;
  mapButtonSize: MapBtnSizeProps;
  renderBorder: RenderContainerBorder;
}

export interface BtnChildProps {
  disabled: boolean;
}

export interface ButtonColorMappings {
  backgroundColor: {
    [key: string]: {
      [key: string]: string;
    };
  };
  borderColor: {
    [key: string]: {
      [key: string]: string;
    };
  };
  textColor: {
    [key: string]: string;
  };
}

export interface ColorMapping {
  default: string;
  hover?: string;
  active?: string;
  focus?: string;
  disabled?: string;
}
