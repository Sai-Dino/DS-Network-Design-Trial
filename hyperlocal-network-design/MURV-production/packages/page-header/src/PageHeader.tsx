import React from "react";
import Breadcrumb from "@murv/breadcrumb";
import Tag from "@murv/tag";
import { Button } from "@murv/button";
import { ButtonGroup } from "@murv/button-group";
import { ChevronLeft } from "@murv/icons";
import { FilterBar } from "@murv/filter-bar";
import { Search } from "@murv/search";
import { PageHeaderProps } from "./types";
import {
  HeaderText,
  LeftContent,
  PageHeaderContainer,
  PageHeaderContent,
  RightContent,
  TagsWrapper,
} from "./styles";

/**
 * Page Header component is Composition of Multiple atom level components like Breadcrumb, Buttons, Filter( page filters), Header Text
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  id,
  dataTestId,
  pageHeaderText,
  breadcrumbProps,
  tags,
  filterProps,
  buttonProps,
  buttonGroupProps,
  searchProps,
}) => {
  if (!pageHeaderText && !breadcrumbProps) {
    throw new Error("Mandatory props missing for page header");
  }

  return (
    <PageHeaderContainer id={id} dataTest-id={dataTestId}>
      <PageHeaderContent>
        <Breadcrumb {...breadcrumbProps} />
      </PageHeaderContent>
      <PageHeaderContent>
        <LeftContent>
          {buttonProps && (
            <Button {...buttonProps}>
              {/* @ts-ignore */}
              <ChevronLeft />
            </Button>
          )}
          <HeaderText tabIndex={0}>{pageHeaderText}</HeaderText>
          {tags && <TagsWrapper>{tags?.map((tag) => <Tag {...tag} />)}</TagsWrapper>}
          {filterProps && <FilterBar {...filterProps} />}
        </LeftContent>
        <RightContent>
          {searchProps && <Search {...searchProps} />}
          {buttonGroupProps && <ButtonGroup {...buttonGroupProps} padding="0" />}
        </RightContent>
      </PageHeaderContent>
    </PageHeaderContainer>
  );
};
