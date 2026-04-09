import React from "react";
import Divider from "@murv/divider";
import { Button } from "@murv/button";
import { useTheme } from "styled-components";
import { ButtonSection, Container, ScrollableSection } from "./styles";
import { SelectionCardProps } from "./types";

export const SelectionCard = ({
  onApply,
  onClear,
  disableApply,
  children,
  width,
  height,
}: SelectionCardProps) => {
  const showButtonSection = !!onApply || !!onClear;

  const theme = useTheme();

  return (
    <Container width={width} height={height}>
      <ScrollableSection trimHeight={showButtonSection}>{children}</ScrollableSection>
      {showButtonSection ? (
        <>
          <Divider
            direction="horizontal"
            additionalStyles={{ borderColor: theme.murv.color.stroke.primary }}
          />
          <ButtonSection>
            {onClear ? (
              <Button buttonType="tertiary" onClick={onClear}>
                Clear
              </Button>
            ) : null}
            {onApply ? (
              <Button buttonType="tertiary" onClick={onApply} disabled={disableApply}>
                Done
              </Button>
            ) : null}
          </ButtonSection>
        </>
      ) : null}
    </Container>
  );
};
