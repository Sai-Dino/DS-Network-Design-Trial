import React from "react";
import { Info } from "@murv/icons";
import Tooltip from "@murv/tooltip";
import { ITileProps } from "./types";
import { TileContainer, HeaderContainer, Heading, IconWrapper, Label, Description } from "./style";

export interface CompositeTile {
  SimpleTile: typeof SimpleTile;
  TileWithIcon: typeof TileWithIcon;
}

function Container({
  children,
  selected,
  disabled,
  heading,
  testId,
  onHover,
  ...props
}: ITileProps) {
  return (
    <TileContainer
      selected={selected}
      disabled={disabled}
      aria-selected={selected}
      aria-disabled={disabled}
      aria-label={heading}
      aria-roledescription="Display Text Description"
      data-testid={testId}
      id={props.id}
      onMouseEnter={onHover}
      {...props}
    >
      {children}
    </TileContainer>
  );
}

export function TileBody({ label, description, disabled }: Partial<ITileProps>) {
  return (
    <>
      <Label>{label}</Label>
      {description?.length ? <Description disabled={disabled}>{description}</Description> : null}
    </>
  );
}
export function TileWithIcon({
  heading = "",
  infoText,
  tooltipPosition = "right",
  ...props
}: ITileProps) {
  return (
    <Container {...props}>
      <HeaderContainer>
        <Heading>{heading}</Heading>
        <IconWrapper className="__tile__header__icon">
          <Tooltip
            id={`${props.id || props.testId}-tooltip`}
            dataTestId={`${props.testId}-tooltip`}
            tooltipText={infoText || ""}
            position={tooltipPosition}
            showIcon={false}
          >
            <Info />
          </Tooltip>
        </IconWrapper>
      </HeaderContainer>
      <TileBody {...props} />
    </Container>
  );
}

export function SimpleTile({ heading, ...props }: ITileProps) {
  return (
    <Container {...props}>
      <HeaderContainer>
        <Heading>{heading}</Heading>
      </HeaderContainer>
      <TileBody {...props} />
    </Container>
  );
}

export function Tile({ onClick, ...props }: ITileProps & CompositeTile) {
  return <TileContainer onClick={onClick} {...props} />;
}

export default Tile;

Tile.SimpleTile = SimpleTile;
Tile.TileWithIcon = TileWithIcon;
