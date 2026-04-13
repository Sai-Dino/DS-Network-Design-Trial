import React from "react";
import SingleSelect from "@murv/single-select";
import { IPageSizeSelectorProps } from "./types";

const PageSizeSelector: React.FC<IPageSizeSelectorProps> = ({
  options,
  selectedPageSize,
  onChange,
  name = "page-selector",
}) => {
  const transformedData = options.map((item) => ({
    label: `${item.label}`,
    value: item.value.toString(),
  }));

  return (
    <SingleSelect
      withSearch={false}
      name={name}
      id="page-selector"
      label="Items / page"
      orientation="top"
      triggerType="filter"
      withBorder
      popOverWidth="160px"
      maxBadgeWidth={100}
      options={transformedData}
      value={selectedPageSize.toString()}
      onChange={(selectedValue) => {
        onChange(Number(selectedValue));
      }}
    />
  );
};

export default PageSizeSelector;
