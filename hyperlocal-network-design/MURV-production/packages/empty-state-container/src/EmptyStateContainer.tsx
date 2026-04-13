import React from "react";
import { ButtonGroup } from "@murv/button-group";
import { TEmptyStateContainerProps } from "./types";
import { Container, UserText, PrimaryText, ButtonWrapper, Illustration } from "./styles";

import { Icon } from "./Icons";

export function EmptyStateContainer({
  primaryMessage,
  userMessage,
  buttonGroupProps,
  ...rest
}: TEmptyStateContainerProps) {
  let illustrationContent: JSX.Element | null = null;
  if ("icon" in rest) {
    illustrationContent = <Icon data-testid="empty-container-icon-test-id" id={rest.icon} />;
  } else if ("imageUrl" in rest) {
    illustrationContent = (
      <Illustration height={rest.height} width={rest.width} src={rest.imageUrl} alt={rest.alt} />
    );
  }
  return (
    <Container>
      {illustrationContent}
      <PrimaryText>{primaryMessage}</PrimaryText>
      <UserText>{userMessage}</UserText>
      {buttonGroupProps && (
        <ButtonWrapper>
          <ButtonGroup {...buttonGroupProps} padding="12" />
        </ButtonWrapper>
      )}
    </Container>
  );
}
