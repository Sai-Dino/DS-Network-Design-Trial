import styled, {
  css,
  DefaultTheme,
  ThemedCssFunction,
  ThemeProps,
  FlattenInterpolation,
} from "styled-components";
import { FieldType } from "./types";

const SubText = styled.div<{ width?: string }>`
  font-weight: ${({ theme }) => theme.murv.typography.body.s.weight};
  line-height: ${({ theme }) => theme.murv.typography.body.s.lineHeight};
  font-size: ${({ theme }) => theme.murv.typography.subtext.s.size};
  max-width: ${({ width }) => width};
`;

export const InputLabel = styled(SubText)<{
  compact: boolean;
}>`
  margin-bottom: ${({ theme }) => theme.murv.spacing.s};
  font-style: normal;
  line-height: ${({ theme }) => theme.murv.typography.subtext.s.lineHeight}; //16
  font-weight: ${({ theme }) => theme.murv.typography.subtext.s.weight};
  font-size: ${({ theme }) => theme.murv.typography.subtext.s.size}; //11
  margin-top: ${({ compact, theme }) => (compact ? theme.murv.spacing.s : 0)};
  width: fit-content;
`;
export const Instruction = styled(SubText as any)<{ isError: boolean; disabled: boolean }>`
  ${({ isError, disabled }) => {
    if (isError) {
      return css`
        color: ${({ theme }) => theme.murv.color.text.danger};
      `;
    }
    if (disabled) {
      return css`
        color: ${({ theme }) => theme.murv.color.text.disabled};
      `;
    }
    return css`
      color: ${({ theme }) => theme.murv.color.text.secondary};
    `;
  }}
  padding: ${({ theme }) => `0 ${theme.murv.spacing.m}`};
  margin-top: ${({ theme }) => theme.murv.spacing.s};
  display: flex;
  max-width: ${({ width }) => width};
  .helpText {
    max-width: ${({ width }) => width};
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
  font-style: normal;
  line-height: ${({ theme }) => theme.murv.typography.subtext.s.lineHeight};
  font-weight: ${({ theme }) => theme.murv.typography.subtext.s.weight};
  font-size: ${({ theme }) => theme.murv.typography.subtext.s.size}; //11
`;

export const InstructionText = styled.div`
  display: flex;
  justify-content: flex-start;
  width: 100%;
`;

export const StyledInput = styled.input<{
  disabled: boolean;
}>`
  border: none;
  outline: none;
  background: transparent;
  padding: ${({ theme }) => theme.murv.spacing.s} 0;
  font-size: ${({ theme }) => theme.murv.typography.body.s.size}; // 13px
  line-height: ${({ theme }) => theme.murv.typography.body.s.lineHeight};
  font-weight: ${({ theme }) => theme.murv.typography.subtext.s.weight};
  width: 100%;
`;
export const Icon = styled.img<{ disabled: boolean }>`
  &.prefixIcon {
    width: ${({ theme }) => theme.murv.spacing.xl};
    margin-right: ${({ theme }) => theme.murv.spacing.s};
  }
  &.resize-icon {
    width: ${({ theme }) => theme.murv.spacing.l};
    position: absolute;
    bottom: ${({ theme }) => theme.murv.spacing.s};
    right: ${({ theme }) => theme.murv.spacing.s};
    z-index: ${({ theme }) => theme.murv.zIndex.level0};
  }
  &.prefixIcon,
  &.suffixIcon,
  &.actionIcon {
    cursor: pointer;
    opacity: ${({ theme, disabled }) =>
      disabled ? parseInt(theme.murv.opacity.disabled, 10) / 100 : 1};
  }
`;

export const SuffixIconWrapper = styled.div<{
  content: "space-between" | "center";
}>`
  display: flex;
  flex-direction: row;
  justify-content: ${({ content = "flex-start" }) => content};
  gap: ${({ theme }) => theme.murv.spacing.xxs};
  align-items: flex-end;
  height: 100%;
  padding: ${({ theme }) => theme.murv.spacing.s} ${({ theme }) => theme.murv.spacing.s}
    ${({ theme }) => theme.murv.spacing.s} 0;
`;

export const PrefixIconWrapper = styled.div<{
  content: "space-between" | "center";
}>`
  display: flex;
  flex-direction: row;
  justify-content: ${({ content = "flex-start" }) => content};
  gap: ${({ theme }) => theme.murv.spacing.xxs};
  align-items: flex-end;
  height: 100%;
  padding: ${({ theme }) => theme.murv.spacing.s} 0 ${({ theme }) => theme.murv.spacing.s}
    ${({ theme }) => theme.murv.spacing.s};
`;

export const StyledTextArea = styled.textarea<{
  disabled: boolean;
}>`
  width: 100%;
  border-radius: ${({ theme }) => theme.murv.radius.s};
  outline: none;
  border: none;
  position: relative;
  z-index: ${({ theme }) => theme.murv.zIndex.level1};
  background: transparent;
  ::-webkit-resizer {
    display: none;
  }
  font-size: ${({ theme }) => theme.murv.typography.body.s.size};
  line-height: ${({ theme }) => theme.murv.typography.body.s.lineHeight};
  font-weight: ${({ theme }) => theme.murv.typography.subtext.s.weight};
  padding: ${({ theme }) => theme.murv.spacing.m} 0;
  font-family: inherit;
`;

export const TextAreaContainer = styled.div`
  display: flex;
  svg {
    position: absolute;
    bottom: 0.5em;
    right: 0.4em;
    padding: ${({ theme }) => theme.murv.spacing.s};
  }
`;

const ThemeStyles: {
  [key in Partial<FieldType> & "disbaled"]: FlattenInterpolation<ThemeProps<DefaultTheme>>;
} = {
  pressed: css`
    border: 2px solid ${({ theme }) => theme.murv.color.stroke.brandlight};
    background: ${({ theme }) => theme.murv.color.surface.input.pressed};
  `,
  focus: css`
    border: 2px solid ${({ theme }) => theme.murv.color.stroke.brand};
    background: ${({ theme }) => theme.murv.color.surface.neutral.hover};
  `,

  hover: css`
    background: ${({ theme }) => theme.murv.color.surface.input.hover};
    border: 2px solid ${({ theme }) => theme.murv.color.stroke.primary};
  `,
  error: css`
    border: 2px solid ${({ theme }) => theme.murv.color.stroke.dangerlight};
  `,

  default: css`
    background: ${({ theme }) => theme.murv.color.surface.neutral.default};
    border: 2px solid ${({ theme }) => theme.murv.color.surface.information.pressed};
  `,
  disabled: css`
    * {
      color: ${({ theme }) => theme.murv.color.text.disabled};
      cursor: not-allowed;
    }
    color: ${({ theme }) => theme.murv.color.text.disabled};
    background: ${({ theme }) => theme.murv.color.surface.disabled.default};
    border: 2px solid ${({ theme }) => theme.murv.color.stroke.disabled};
    cursor: not-allowed;
  `,
};

const applyStyles = (isDisabled: boolean, type: FieldType) => {
  function SetStyles(
    this: {
      theme: number;
      disabled: boolean;
      setStyles: (theme: number) => void;
      getStyles: (action: FieldType & "disabled") => ThemedCssFunction<DefaultTheme>;
    },
    disabled: boolean,
  ) {
    this.disabled = disabled;

    this.getStyles = (action: FieldType & "disabled"): any => {
      if (this.disabled) {
        return ThemeStyles["disabled" as FieldType & "disabled"];
      }
      return ThemeStyles[action];
    };
  }

  const styles = new (SetStyles as any)(isDisabled);
  return styles.getStyles(type);
};

export const InputContainer = styled.div<{
  selected?: boolean;
  disabled?: boolean;
  fieldType: FieldType;
  compact: boolean;
}>`
  * {
    pointer-events: ${({ disabled }) => (disabled ? "none" : "auto")};
    cursor: ${({ disabled }) => (disabled ? "not-allowed" : "auto")};
  }
  width: fit-content;
  display: flex;
  flex-direction: row;
  align-items: center;
  min-width: 100px;
  background: ${({ theme }) => theme.murv.color.surface.neutral.default};
  font-weight: ${({ theme }) => theme.murv.typography.body.s.weight};
  line-height: ${({ theme }) => theme.murv.typography.body.s.lineHeight};
  position: relative;
  border-radius: ${({ theme }) => theme.murv.radius.s};
  width: 100%;
  color: ${({ theme }) => theme.murv.color.text.secondary};
  ${({ disabled = false, fieldType = "default" }) => applyStyles(disabled, fieldType)}
  &:hover {
    ${({ disabled = false }) => applyStyles(disabled, "hover")}
  }
  &:focus,
  &:focus-within {
    ${({ disabled = false }) => applyStyles(disabled, "focus")}
  }
  &:active {
    ${({ disabled = false }) => applyStyles(disabled, "pressed")}
  }
  gap: ${({ theme }) => theme.murv.spacing.xxs};
  overflow: hidden;

  @media only screen and (max-width: 480px) {
    min-width: 64px;
  }
`;

export const HeaderContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.murv.spacing.m};
  align-items: center;
`;

export const Heading = styled.h3`
  font-size: ${({ theme }) => theme.murv.typography.heading.l.size};
  font-weight: ${({ theme }) => theme.murv.typography.heading.s.weight};
  line-height: ${({ theme }) => theme.murv.typography.heading.s.lineHeight};
`;

export const IconWrapper = styled.div`
  display: flex;
  cursor: pointer;
`;

export const Label = styled.label`
  font-size: ${({ theme }) => theme.murv.typography.body.s.size};
  font-weight: 400;
  line-height: ${({ theme }) => theme.murv.typography.heading.m.lineHeight};
  letter-spacing: ${({ theme }) => theme.murv.typography.heading.m.letterSpacing};
`;

export const Description = styled.text<{ disabled?: boolean }>`
  font-size: ${({ theme }) => theme.murv.typography.subtext.s.size};
  color: ${({ theme, disabled }) =>
    disabled ? theme.murv.color.text.disabled : theme.murv.color.surface.inverse.pressed};
`;

export const InputLabelContainer = styled.div<{
  compact: boolean;
  disabled: boolean;
  width?: string;
}>`
  color: ${({ theme, disabled }) =>
    disabled ? theme.murv.color.text.disabled : theme.murv.color.text.primary};
  width: ${({ width = "200px", compact }) => (compact ? "100%" : width)};
  display: flex;
  flex-direction: ${({ compact }) => (compact ? "row" : "column")};
  justify-content: space-between;
  gap: ${({ compact, theme }) => (compact ? theme.murv.spacing.xl : 0)};
`;

export const Count = styled.div`
  display: flex;
  justify-content: flex-end;
  flex-grow: 1;
`;

export const InputWrapper = styled.div<
  Partial<{
    width: string;
    compact: boolean;
  }>
>`
  display: flex;
  flex-direction: column;
  flex-grow: ${({ compact }) => (compact ? 0 : 1)};
  width: ${({ compact, width }) => (compact ? width : "100%")};
`;

export const OptionalText = styled.span`
  color: ${({ theme }) => theme.murv.color.text.secondary};
  margin-left: ${({ theme }) => theme.murv.spacing.s};
`;

export const ResizeIconWrapper = styled.span`
  position: absolute;
  right: 0;
  bottom: 0;
`;
