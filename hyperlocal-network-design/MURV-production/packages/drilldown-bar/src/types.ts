import { FC, PropsWithChildren } from "react";
import { ButtonProps } from "@murv/button";
import { ISearchProps } from "@murv/search";
import { SearchFeedbackProps } from "@murv/search-feedback";
import { FilterBarProps } from "@murv/filter-bar";
import { ButtonGroupProps } from "@murv/button-group";

export interface IDrilldownBarProps {
  /**
   * Id for DrilldownBar component
   */
  id?: string;
  /**
   * Pass test id for unit tests
   */
  dataTestId?: string;
}

export interface DrilldownBarComponent extends FC<IDrilldownBarProps> {
  Line: FC<PropsWithChildren<{}>>;
  Search: FC<ISearchProps>;
  SearchFeedback?: FC<SearchFeedbackProps>;
  FilterBar?: FC<FilterBarProps>;
  Button?: FC<ButtonProps>;
  ButtonGroup?: FC<ButtonGroupProps>;
}
