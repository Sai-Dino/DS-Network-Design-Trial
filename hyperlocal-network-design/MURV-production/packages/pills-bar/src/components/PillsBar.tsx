import React, { PropsWithChildren } from "react";

import isValidChildren from "@murv/core/utils/validate-children";
import { Container } from "../styles";
import { IBasePillsBarProps, TPillsBarProps } from "../types";
import { PillBarProvider } from "../provider/PillsBarProvider";
import PillBase from "./PillBase";

const BasePillBar = ({
  isScroll = true,
  paddingVertical,
  paddingHorizontal,
  gap,
  children,
  dataTestId,
}: PropsWithChildren<IBasePillsBarProps>) => {
  const { isValid, validChildren } = isValidChildren({
    allowedTypes: [PillBase],
  })(children);

  if (!isValid) {
    console.error("Only Valid children are allowed.");
  }

  return (
    <Container
      data-testid={dataTestId}
      isScroll={isScroll}
      paddingVertical={paddingVertical}
      paddingHorizontal={paddingHorizontal}
      gap={gap}
    >
      {validChildren}
    </Container>
  );
};

export const PillsBar = ({
  isPrefixReplaceable = false,
  isMultiSelect = false,
  selectedPills = "",
  onSelectedChange = () => {},
  ...rest
}: PropsWithChildren<TPillsBarProps>) => (
  <PillBarProvider
    isMultiSelect={isMultiSelect}
    isPrefixReplaceable={isPrefixReplaceable}
    selectedPills={selectedPills}
    onSelectedChange={onSelectedChange}
  >
    <BasePillBar {...rest} />
  </PillBarProvider>
);

PillsBar.Pill = PillBase;
