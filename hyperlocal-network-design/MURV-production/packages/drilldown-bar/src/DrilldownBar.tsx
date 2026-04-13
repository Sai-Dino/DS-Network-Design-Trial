import React, { PropsWithChildren } from "react";
import isValidChildren from "@murv/core/utils/validate-children";
import { Button } from "@murv/button";
import { ButtonGroup } from "@murv/button-group";
import { ISearchProps, Search } from "@murv/search";
import { SearchFeedback, SearchFeedbackProps } from "@murv/search-feedback";
import { FilterBar } from "@murv/filter-bar";
import {
  DrilldownBarWrapper,
  Line,
  SearchFeebackWrapper,
  SearchWrapper,
  FilterBarWrapper,
} from "./styles";
import { DrilldownBarComponent, IDrilldownBarProps } from "./types";

const DrilldownBarSearch: React.FC<ISearchProps> = (props) => (
  <SearchWrapper>
    <Search {...props} />
  </SearchWrapper>
);

const DrilldownBarSearchFeedback: React.FC<SearchFeedbackProps> = (props) => (
  <SearchFeebackWrapper>
    <SearchFeedback {...props} width="100%" />
  </SearchFeebackWrapper>
);

const DrilldownBarFilterBar: React.FC<any> = (props) => (
  <FilterBarWrapper>
    <FilterBar {...props} />
  </FilterBarWrapper>
);

const DrilldownBarLine: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  // Filter out falsy values (false, null, undefined) before passing to isValidChildren
  const childrenArray = React.Children.toArray(children).filter(Boolean);

  const { validChildren } = isValidChildren({
    allowedTypes: [
      DrilldownBarSearch,
      DrilldownBarSearchFeedback,
      DrilldownBarFilterBar,
      Button,
      ButtonGroup,
    ],
  })(childrenArray);
  return <Line>{validChildren}</Line>;
};

const DrilldownBar: DrilldownBarComponent = ({
  id,
  dataTestId,
  children,
}: PropsWithChildren<IDrilldownBarProps>) => {
  const { validChildren } = isValidChildren({
    allowedTypes: [DrilldownBarLine],
  })(children);

  return (
    <DrilldownBarWrapper id={id} data-testid={dataTestId}>
      {validChildren}
    </DrilldownBarWrapper>
  );
};

DrilldownBar.Line = DrilldownBarLine;
DrilldownBar.Search = DrilldownBarSearch;
DrilldownBar.SearchFeedback = DrilldownBarSearchFeedback;
DrilldownBar.FilterBar = DrilldownBarFilterBar;
DrilldownBar.Button = Button;
DrilldownBar.ButtonGroup = ButtonGroup;

export default DrilldownBar;
