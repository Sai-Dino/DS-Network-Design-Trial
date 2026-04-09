import { useTheme } from "styled-components";
import { ButtonColorMappings, ColorMapping, ButtonSize, BtnStyleType } from "../types";

const useButtonUtils = () => {
  // consuming central theme.murv.
  const theme = useTheme();

  const commonColors = {
    brandPrimary: theme?.murv?.color.surface.brand.default,
    ascent: theme?.murv?.color.surface.accent.default,
    neutralSecondary: theme?.murv?.color.surface.information.pressed,
    dangerSecondary: theme?.murv?.color.text.danger,
    blackText: theme?.murv?.color.text.primary,
  };

  const defaultColorMapping: ColorMapping = {
    default: "transparent",
    hover: "transparent",
    active: "transparent",
    disabled: "transparent",
  };

  const defaultBorderColorMapping: ColorMapping = {
    default: "none",
    hover: "none",
    active: "none",
    disabled: "none",
  };

  const commonBGMapping = {
    hover: theme?.murv?.color.surface.neutral.hover,
    active: theme?.murv?.color.surface.neutral.pressed,
    focus: theme?.murv?.color.surface.neutral.hover,
    isLoading: theme?.murv?.color.surface.neutral.pressed,
  };

  // Color Mappings for BG, Border, Text color based on the type and button state.
  const buttonColorMappings: ButtonColorMappings = {
    backgroundColor: {
      primary: {
        default: commonColors.brandPrimary,
        hover: theme?.murv?.color.surface.brand.hover,
        active: theme?.murv?.color.surface.brand.pressed,
        focus: theme?.murv?.color.surface.brand.hover,
        disabled: theme?.murv?.color.surface.disabled.default,
        isLoading: theme?.murv?.color.surface.brand.pressed,
      },
      brandSecondary: {
        hover: theme?.murv?.color.surface.neutral.hover,
        active: theme?.murv?.color.surface.neutral.pressed,
        focus: theme?.murv?.color.surface.neutral.hover,
        disabled: "transparent",
        isLoading: theme?.murv?.color.surface.neutral.pressed,
      },
      commonSecondary: { ...defaultColorMapping, ...commonBGMapping },
      commonTertiary: { ...defaultColorMapping, ...commonBGMapping },
      floating: {
        default: commonColors.brandPrimary,
        hover: theme?.murv?.color.surface.brand.hover,
        active: theme?.murv?.color.surface.brand.pressed,
        focus: theme?.murv?.color.surface.brand.hover,
        disabled: theme?.murv?.color.surface.neutral.hover,
        isLoading: theme?.murv?.color.surface.brand.pressed,
      },
      ascent: {
        default: commonColors.ascent,
        hover: theme?.murv?.color.surface.accent.hover,
        active: theme?.murv?.color.surface.accent.pressed,
        focus: theme?.murv?.color.surface.accent.hover,
        disabled: theme?.murv?.color.surface.neutral.hover,
        isLoading: theme?.murv?.color.surface.accent.pressed,
      },
      default: { ...defaultColorMapping },
    },
    borderColor: {
      primary: {
        default: `2px solid ${theme?.murv?.color.stroke.brand}`,
        hover: `2px solid ${theme?.murv?.color.surface.brand.hover}`,
        active: `none`,
        focus: `2px solid ${theme?.murv?.color.surface.brand.hover}`,
        disabled: `2px solid ${theme?.murv?.color.stroke.disabled}`,
      },
      floating: {
        default: `2px solid ${theme?.murv?.color.surface.brand.default}`,
        hover: `2px solid ${theme?.murv?.color.surface.brand.hover}`,
        active: `2px solid ${theme?.murv?.color.surface.brand.pressed}`,
        focus: `2px solid ${theme?.murv?.color.surface.brand.hover}`,
        disabled: `2px solid ${theme?.murv?.color.stroke.primary}`,
      },
      ascent: {
        default: `2px solid ${commonColors.ascent}`,
        hover: `2px solid ${theme?.murv?.color.surface.accent.hover}`,
        active: `2px solid ${theme?.murv?.color.surface.accent.hover}`,
        focus: `2px solid ${theme?.murv?.color.surface.accent.hover}`,
        disabled: `2px solid ${theme?.murv?.color.stroke.primary}`,
      },
      inline: {
        focus: `none`,
      },
      commonSecondary: {
        default: `2px solid ${theme?.murv?.color.stroke.primary}`,
        hover: `2px solid ${theme?.murv?.color.stroke.primary}`,
        active: `2px solid ${theme?.murv?.color.stroke.primary}`,
        focus: `2px solid ${theme?.murv?.color.surface.brand.default}`,
        disabled: `2px solid ${theme?.murv?.color.stroke.primary}`,
      },
      commonTertiary: { focus: `none` },
      default: { ...defaultBorderColorMapping },
    },
    textColor: {
      ascent: commonColors.blackText,
      neutral: commonColors.blackText,
      brand: commonColors.brandPrimary,
      inline: commonColors.brandPrimary,
      danger: commonColors.dangerSecondary,
      disabled: theme?.murv?.color.text.disabled,
      default: theme?.murv?.color.surface.neutral.default,
    },
  };

  // Mapping Button BG color based on the type and button state.
  const mapButtonBGColor = (
    type: string,
    style: string,
    state: string = "",
    disabled: boolean = false,
    isLoading: boolean = false,
  ): string => {
    let bgColor: string;
    let bgColorMapping = buttonColorMappings.backgroundColor.default;
    if (
      type === BtnStyleType.primary ||
      type === BtnStyleType.ascent ||
      type === BtnStyleType.floating
    ) {
      bgColorMapping =
        buttonColorMappings.backgroundColor[type] || buttonColorMappings.backgroundColor.default;
    }
    if (
      type === BtnStyleType.secondary ||
      type === BtnStyleType.tertiary ||
      type === BtnStyleType.inline
    ) {
      if (style === "brand" && type === BtnStyleType.secondary) {
        bgColorMapping =
          buttonColorMappings.backgroundColor.brandSecondary ||
          buttonColorMappings.backgroundColor.default;
      } else if (type === BtnStyleType.secondary) {
        bgColorMapping =
          buttonColorMappings.backgroundColor.commonSecondary ||
          buttonColorMappings.backgroundColor.default;
      } else if (type === BtnStyleType.tertiary) {
        bgColorMapping =
          buttonColorMappings.backgroundColor.commonTertiary ||
          buttonColorMappings.backgroundColor.default;
      }
    }
    if (disabled) {
      bgColor = bgColorMapping.disabled || bgColorMapping.default || "transparent";
    } else if (isLoading) {
      bgColor = bgColorMapping.isLoading || bgColorMapping.default || "transparent";
    } else {
      bgColor = bgColorMapping[state] || bgColorMapping.default || "transparent";
    }
    return bgColor;
  };

  // Mapping Button Border color based on the type and button state.
  const mapButtonBorderColor = (
    type: string,
    style: string,
    state: string = "",
    disabled: boolean = false,
  ): string => {
    let borderColorMapping = buttonColorMappings.borderColor.default;
    if (
      type === BtnStyleType.primary ||
      type === BtnStyleType.ascent ||
      type === BtnStyleType.floating
    ) {
      borderColorMapping = buttonColorMappings.borderColor[type];
    }
    if (
      type === BtnStyleType.secondary ||
      type === BtnStyleType.tertiary ||
      type === BtnStyleType.inline
    ) {
      if (type === BtnStyleType.secondary) {
        borderColorMapping = buttonColorMappings.borderColor.commonSecondary;
      } else if (type === BtnStyleType.tertiary) {
        borderColorMapping = buttonColorMappings.borderColor.commonTertiary;
      } else if (type === BtnStyleType.inline) {
        borderColorMapping = buttonColorMappings.borderColor.inline;
      }
    }
    const borderColor = borderColorMapping[disabled ? "disabled" : state] || "none";
    return borderColor;
  };

  // Mapping Button Text color based on the type and button state.
  const mapButtonTextColor = (type: string, style: string, disabled: boolean = false): string => {
    if (
      type === BtnStyleType.floating ||
      type === BtnStyleType.ascent ||
      (type === BtnStyleType.inline && style === "brand") ||
      type === BtnStyleType.primary
    ) {
      return (
        buttonColorMappings.textColor[disabled ? "disabled" : type] ||
        buttonColorMappings.textColor.default ||
        theme?.murv?.color.surface.neutral.default
      );
    }
    return (
      buttonColorMappings.textColor[disabled ? "disabled" : style] ||
      buttonColorMappings.textColor.default ||
      theme?.murv?.color.surface.neutral.default
    );
  };

  // Mapping Button Text Size based on the type and button state.
  const mapBtnSize = (type: string): string => {
    const mapSize = {
      [ButtonSize.small]: "32px",
      [ButtonSize.large]: "40px",
    };
    return mapSize[type as keyof typeof mapSize] || "32px";
  };

  // To render outline border
  const renderContainerBorder = (type: string): boolean => {
    switch (type) {
      case "primary":
      case "ascent":
      case "floating":
      case "inline":
      case "tertiary":
        return true;
      default:
        return false;
    }
  };

  // To fill the icon with respective of button type
  const mapIconColorWithBtnType = (type: string, style: string): string => {
    let argStyle = style;
    if (
      type === BtnStyleType.floating ||
      type === BtnStyleType.ascent ||
      (type === BtnStyleType.inline && style === "brand") ||
      type === BtnStyleType.primary ||
      type === "disabled"
    ) {
      argStyle = type;
    }
    switch (argStyle) {
      case "ascent":
      case "neutral":
        return theme?.murv?.color.surface.inverse.default;
      case "brand":
      case "inline":
        return theme?.murv?.color.surface.brand.default;
      case "danger":
        return theme?.murv?.color.text.danger;
      case "disabled":
        return theme?.murv?.color.text.disabled;
      default:
        return theme?.murv?.color.surface.neutral.default;
    }
  };

  return {
    mapButtonBGColor,
    mapButtonBorderColor,
    mapButtonTextColor,
    mapBtnSize,
    renderContainerBorder,
    mapIconColorWithBtnType,
  };
};

export default useButtonUtils;
