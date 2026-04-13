import React from "react";
import Avatar from "@murv/avatar";
import { Search } from "@murv/search";
import ButtonGroup from "@murv/button-group";
import SingleSelect from "@murv/single-select";
import { BrandLogo, ProductHeaderContent, ProductHeaderWrapper, RightContent } from "./styles";
import { ProductHeaderProps } from "./types";

/**
 * A product header is a loyout component consiting of Brand Logo, Search, Filter Bar, Button Group and Filter Bar Base
 */
export const ProductHeader: React.FC<ProductHeaderProps> = ({
  id,
  dataTestId,
  brandLogoURL,
  onBrandLogoClick,
  searchProps,
  buttonGroupProps,
  profileImage,
  profileDropdown,
  contentWidth = "1280px",
}) => (
  <ProductHeaderWrapper id={id} data-testid={dataTestId}>
    <ProductHeaderContent contentWidth={contentWidth}>
      {brandLogoURL && <BrandLogo src={brandLogoURL} alt="brand-logo" onClick={onBrandLogoClick} />}
      {searchProps && <Search {...searchProps} />}
      <RightContent>
        {/* Add Filter Bar when available */}
        {buttonGroupProps && <ButtonGroup spacing="0" {...buttonGroupProps} />}
        {/* Add filter bar base when available */}
        <>
          {profileImage && <Avatar type="image">{profileImage}</Avatar>}
          {profileDropdown && (
            <SingleSelect
              withSearch={false}
              label={profileDropdown.name}
              orientation="vertical-reverse"
              options={profileDropdown.options}
              name={profileDropdown.name}
              id="ProfileAvatar"
              onChange={(selectedValue: string) => profileDropdown.cb(selectedValue)}
            />
          )}
        </>
      </RightContent>
    </ProductHeaderContent>
  </ProductHeaderWrapper>
);
