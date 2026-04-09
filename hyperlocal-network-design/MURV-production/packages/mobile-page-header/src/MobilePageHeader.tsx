import React, { useState } from "react";
import Button from "@murv/button";
import ButtonGroup from "@murv/button-group";
import Search from "@murv/search";
import Toggle from "@murv/toggle";
import { Search as SearchIcon, ChevronLeft } from "@murv/icons";
import { MobilePageHeaderProps } from "./types";
import {
  BrandInfo,
  BrandLogo,
  MobilePageHeaderWrapper,
  PageTitle,
  PageSubTitle,
  RightContent,
} from "./styles";

export const MobilePageHeader: React.FC<MobilePageHeaderProps> = ({
  id,
  dataTestId,
  brandLogoURL,
  onBrandLogoClick,
  pageTitle,
  pageSubTitle,
  searchProps,
  buttonGroupProps,
  toggleProps,
  backButtonProps,
}) => {
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const showSearch = () => setIsSearchVisible(true);
  const hideSearch = () => setIsSearchVisible(false);

  return (
    <MobilePageHeaderWrapper id={id} data-testid={dataTestId} isBackButton={!!backButtonProps}>
      {(backButtonProps || isSearchVisible) && (
        <Button
          {...backButtonProps}
          buttonType="tertiary"
          onClick={() => {
            hideSearch();
            backButtonProps?.onClick?.();
          }}
        >
          {/* @ts-ignore */}
          {backButtonProps?.children ?? <ChevronLeft color="black" />}
        </Button>
      )}
      {!isSearchVisible && (
        <BrandInfo>
          {brandLogoURL ? (
            <BrandLogo src={brandLogoURL} alt="brand-logo" onClick={onBrandLogoClick} />
          ) : (
            <>
              {pageTitle && <PageTitle>{pageTitle}</PageTitle>}
              {pageSubTitle && <PageSubTitle>{pageSubTitle}</PageSubTitle>}
            </>
          )}
        </BrandInfo>
      )}
      {searchProps && isSearchVisible && <Search {...searchProps} />}
      <RightContent>
        {searchProps && !isSearchVisible && (
          <Button buttonType="tertiary" size="small" onClick={showSearch}>
            {/* @ts-ignore */}
            <SearchIcon color="black" />
          </Button>
        )}
        {buttonGroupProps && !isSearchVisible && (
          <ButtonGroup {...buttonGroupProps} padding="0" spacing="0" />
        )}
        {toggleProps && <Toggle {...toggleProps} />}
      </RightContent>
    </MobilePageHeaderWrapper>
  );
};
