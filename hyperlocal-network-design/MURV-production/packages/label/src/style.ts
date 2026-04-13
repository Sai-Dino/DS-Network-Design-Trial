import styled from "styled-components";
import { LabelVariant } from "./types";

export const LabelWrapper = styled.label<{ disabled: boolean; rtl: boolean }>`
  display: inline-flex;
  align-items: start;
  cursor: pointer;
  vertical-align: middle;
  flex-direction: ${({ rtl = false }) => (rtl ? "row-reverse" : "row")};
  pointer-events: ${({ disabled }) => (disabled ? "none" : "auto")};
`;

export const LabelText = styled.span<{ disabled: boolean; size: string; variant: LabelVariant }>`
  user-select: none;
  line-height: ${({ theme }) => theme.murv.typography.body.s.lineHeight};
  color: ${({ theme, disabled }) =>
    disabled ? theme.murv.color.text.disabled : theme.murv.color.text.primary};
  font-weight: ${({ theme }) => theme.murv.typography.subtext.s.weight};
  font-size: ${({ theme, size, variant }) => {
    if (variant === "compact") return theme.murv.typography.body.s.size;
    return size === "small"
      ? theme.murv.typography.body.s.size
      : theme.murv.typography.heading.s.size;
  }};
`;

export const DescriptionText = styled.div<{ disabled: boolean; variant: LabelVariant }>`
  user-select: none;
  color: ${({ theme, disabled }) =>
    disabled ? theme.murv.color.text.disabled : theme.murv.color.text.secondary};
  font-weight: ${({ theme }) => theme.murv.typography.subtext.s.weight};
  font-size: ${({ theme, variant }) =>
    variant === "compact"
      ? theme.murv.typography.subtext.s.size
      : theme.murv.typography.body.s.size};
  line-height: ${({ theme }) => theme.murv.typography.subtext.s.lineHeight};
`;

export const LabelArea = styled.div`
  display: flex;
  flex-direction: column;
`;
