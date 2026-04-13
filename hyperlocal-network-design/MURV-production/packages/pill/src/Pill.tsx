import { Check } from "@murv/icons";
import { useMURVContext } from "@murv/provider";
import React, { FC } from "react";
import {
  Label,
  LargePillContainer,
  MediumPillContainer,
  PrefixIconWrapper,
  SmallPillContainer,
  SuffixIconWrapper,
} from "./styles";
import { PillProps } from "./types";

export interface CompositePill {
  PillMedium: typeof PillMedium;
  PillSmall: typeof PillSmall;
  PillLarge: typeof PillLarge;
}

const Container: FC<PillProps> = ({
  children,
  selected,
  disabled,
  testId,
  onHover,
  onFocus,
  tabIndex = 0,
  ...props
}) => (
  <SmallPillContainer
    tabIndex={tabIndex}
    selected={selected}
    disabled={disabled}
    aria-selected={selected}
    aria-disabled={disabled}
    role="tab"
    data-testid={testId}
    onMouseEnter={onHover}
    onFocus={onFocus}
    {...props}
  >
    {children}
  </SmallPillContainer>
);

const MediumContainer: FC<PillProps> = ({
  children,
  selected,
  disabled,
  testId,
  onHover,
  onFocus,
  tabIndex = 0,
  ...props
}) => (
  <MediumPillContainer
    tabIndex={tabIndex}
    selected={selected}
    disabled={disabled}
    aria-selected={selected}
    aria-disabled={disabled}
    role="tab"
    data-testid={testId}
    onMouseEnter={onHover}
    onFocus={onFocus}
    {...props}
  >
    {children}
  </MediumPillContainer>
);

const LargeContainer: FC<PillProps> = ({
  children,
  selected,
  disabled,
  testId,
  onHover,
  onFocus,
  tabIndex = 0,
  ...props
}) => (
  <LargePillContainer
    tabIndex={tabIndex}
    selected={selected}
    disabled={disabled}
    aria-selected={selected}
    aria-disabled={disabled}
    role="tab"
    data-testid={testId}
    onMouseEnter={onHover}
    onFocus={onFocus}
    {...props}
  >
    {children}
  </LargePillContainer>
);

export const PillBody = ({
  label,
  suffixIcon,
  prefixIcon,
  isPrefixReplaceable,
  suffixIconCallBack,
  selected,
}: Partial<PillProps>) => {
  const { theme } = useMURVContext();
  return (
    <>
      {selected && isPrefixReplaceable && (
        <PrefixIconWrapper data-testid="prefix-icon">
          <Check color={theme.color.icon.primary} />
        </PrefixIconWrapper>
      )}
      {prefixIcon && (!selected || !isPrefixReplaceable) && (
        <PrefixIconWrapper>{prefixIcon}</PrefixIconWrapper>
      )}
      <Label>{label}</Label>
      {suffixIcon && (
        <SuffixIconWrapper
          onClick={(event) => {
            event?.stopPropagation();
            if (suffixIconCallBack) {
              suffixIconCallBack(event);
            }
          }}
          data-testid="suffix-icon"
        >
          {suffixIcon}
        </SuffixIconWrapper>
      )}
    </>
  );
};

export const PillMedium = ({ ...props }: PillProps) => (
  <MediumContainer {...props} onClick={props.onClick}>
    <PillBody {...props} />
  </MediumContainer>
);

export const PillSmall = ({ ...props }: PillProps) => (
  <Container {...props} onClick={props.onClick}>
    <PillBody {...props} />
  </Container>
);

export const PillLarge = ({ ...props }: PillProps) => (
  <LargeContainer {...props} onClick={props.onClick}>
    <PillBody {...props} />
  </LargeContainer>
);

export function Pill({ onClick, ...props }: PillProps & CompositePill) {
  return <SmallPillContainer onClick={onClick} {...props} />;
}

export default Pill;

Pill.PillMedium = PillMedium;
Pill.PillSmall = PillSmall;
Pill.PillLarge = PillLarge;
