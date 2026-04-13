import React, { FC, useState } from "react";
import Tag from "@murv/tag";
import { Badge } from "@murv/badge";
import { ExpandMore } from "@murv/icons";
import {
  IAccordionChildren,
  IAccordionHeaderProps,
  IAccordionProps,
  IAccordionBodyProps,
} from "../types";
import {
  AccordionView,
  AccordionHeaderView,
  PrimaryInfoView,
  SecondaryInfoView,
  TertiaryInfoView,
  MainInfoView,
  LeftContent,
  RightContent,
  AccordionContentView,
  BadgeWrapper,
  IconWrapper,
  ToggleIconWrapper,
} from "../styles";

const AccordionHeader: FC<IAccordionHeaderProps> = (props) => {
  const {
    disabled = false,
    badgeProps,
    icon,
    tagProps,
    primaryTitle,
    secondaryTitle,
    tertiaryTitle,
    id,
    dataTestId,
    onClick,
    isOpen,
  } = props;
  return (
    <AccordionHeaderView
      disabled={disabled}
      aria-disabled={disabled}
      onClick={onClick}
      data-testId="accordion-header"
      aria-expanded={isOpen}
      tabIndex={0}
    >
      <LeftContent>
        {badgeProps && (
          <BadgeWrapper>
            <Badge type="brand" {...badgeProps}>
              {badgeProps.content}
            </Badge>
          </BadgeWrapper>
        )}
        {icon && <IconWrapper>{icon}</IconWrapper>}
        <MainInfoView>
          <PrimaryInfoView
            id={`acc-primary-header-id-${id}`}
            data-testId={`accordion-primary-header-${dataTestId}`}
            aria-label="accordion-primary-header"
          >
            {primaryTitle}
          </PrimaryInfoView>
          <SecondaryInfoView
            id={`acc-secondary-header-id-${id}`}
            data-testId={`accordion-secondary-header-${dataTestId}`}
            aria-label="accordion-secondary-header"
          >
            {secondaryTitle}
          </SecondaryInfoView>
        </MainInfoView>
      </LeftContent>
      <RightContent>
        <TertiaryInfoView
          id={`acc-tertiary-header-id-${id}`}
          data-testId={`accordion-tertiary-header-${dataTestId}`}
          aria-label="accordion-tertiary-header"
        >
          {tertiaryTitle}
        </TertiaryInfoView>
        {tagProps && <Tag alignment="regular" tagStyle="red" {...tagProps} />}
        <ToggleIconWrapper id="accordion-toggle-icon">
          <ExpandMore aria-label="accordion-toggle-icon" />
        </ToggleIconWrapper>
      </RightContent>
    </AccordionHeaderView>
  );
};

const AccordionContent: FC<IAccordionBodyProps> = ({ id, children, dataTestId, isOpen = false }) =>
  isOpen ? (
    <AccordionContentView
      id={id}
      data-testId={`accordion-body-${dataTestId}`}
      aria-label="accordion-content-container"
    >
      {children}
    </AccordionContentView>
  ) : null;

const Accordion: FC<IAccordionProps> & IAccordionChildren = ({
  id,
  dataTestId,
  children,
  defaultOpen = false,
}: IAccordionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  const childrenWithClick = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === Accordion.Header) {
      return React.cloneElement(child as React.ReactElement<IAccordionHeaderProps>, {
        onClick: toggleAccordion,
        isOpen,
      });
    }
    return child;
  });

  const childrenWithIsOpen = React.Children.map(childrenWithClick, (child) => {
    if (React.isValidElement(child) && child.type === Accordion.Body) {
      return React.cloneElement(child as React.ReactElement<IAccordionBodyProps>, { isOpen });
    }
    return child;
  });

  return (
    <AccordionView id={id} data-testId={`accordion-component-${dataTestId}`}>
      {childrenWithIsOpen}
    </AccordionView>
  );
};

Accordion.Header = AccordionHeader;
Accordion.Body = AccordionContent;

export { Accordion };
