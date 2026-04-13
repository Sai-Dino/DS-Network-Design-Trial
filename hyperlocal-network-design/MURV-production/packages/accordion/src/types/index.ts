import React, { FC } from "react";
import type { BadgeProps } from "@murv/badge";
import type { TagProps } from "@murv/tag";

export interface IAccordionGroupProps {
  gap?: string;
  children?: React.ReactNode;
  dataTestId?: string;
  id?: string;
  exclusive?: boolean;
}

export interface IAccordionChildren {
  Header: FC<IAccordionHeaderProps>;
  Body: FC;
}

export interface IAccordionProps {
  children?: React.ReactNode;
  disabled?: boolean;
  dataTestId?: string;
  id?: string;
  defaultOpen?: boolean;
}

export interface IAccordionHeaderProps {
  badgeProps?: BadgeProps;
  icon?: React.ReactNode;
  tagProps?: TagProps;
  disabled?: boolean;
  primaryTitle: React.ReactNode;
  secondaryTitle?: React.ReactNode | string;
  tertiaryTitle?: React.ReactNode | string;
  dataTestId?: string;
  id?: string;
  onClick?: () => void;
  isOpen?: boolean;
}

export interface IHeaderStyleProps {
  disabled?: boolean;
}

export interface IAccordionContextProps {
  accordionId: string;
}

export interface IAccordionBodyProps {
  id?: string;
  dataTestId?: string;
  children?: React.ReactNode;
  isOpen?: boolean;
}
