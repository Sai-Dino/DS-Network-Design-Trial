import { Button } from "@murv/button";
import { CheckboxWithLabel } from "@murv/checkbox";
import { useId } from "@murv/core/hooks/use-id";
import Divider from "@murv/divider";
import { ChevronLeft, ChevronRight } from "@murv/icons";
import Loader from "@murv/loader";
import { useMURVContext } from "@murv/provider";
import { RefType, Search } from "@murv/search";
import { SearchFeedback } from "@murv/search-feedback";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { CheckBoxTree, CheckBoxTreeRef } from "./CheckBoxTree";
import { FilterWrapper, FilterWrapperChild, LoaderContainer } from "./styles";
import { CheckModel, ICheckBoxTreeProps, ITreeNode } from "./types";

const getTotalSelectableItems = (
  nodes: ITreeNode[],
  checkModel: CheckModel,
  currSelectableSet = new Set<string>(),
  parentDisabled = false,
) => {
  let newSelectableSet = currSelectableSet;
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    if (!parentDisabled && !node.disabled) {
      if (
        checkModel === CheckModel.ALL ||
        (checkModel === CheckModel.LEAF && !node?.children?.length)
      )
        newSelectableSet.add(node.value);

      if (node?.children?.length) {
        newSelectableSet = getTotalSelectableItems(
          node.children,
          checkModel,
          newSelectableSet,
          false,
        );
      }
    }
  }

  return newSelectableSet;
};

const getTotalSelectableItemsCount = (nodes: ITreeNode[], checkModel: CheckModel) =>
  getTotalSelectableItems(nodes, checkModel).size;

export interface ICheckBoxTreeFilterProps extends Omit<ICheckBoxTreeProps, "shouldRender"> {
  searchPlaceHolder?: string;
  onHandleSearch?: (value: string) => void;
}

export const CheckBoxTreeFilter: React.FunctionComponent<ICheckBoxTreeFilterProps> = ({
  id,
  nodes,
  selected,
  onSelect,
  checkModel = "LEAF",
  dataTestId,
  searchPlaceHolder,
  debounceTimer = 250,
  onHandleSearch,
  isLoading = false,
}) => {
  const { theme } = useMURVContext();
  const ref = useRef<CheckBoxTreeRef>(null);
  const [inputValue, setInputValue] = useState("");
  const [showSelected, setShowSelected] = useState(false);
  const checkedOptionSet = useMemo(() => new Set(selected), [selected]);
  const searchRef = useRef<RefType>(null);
  const uniqueID = useId();
  const composingID = `checkbox-tree-${id || uniqueID}`;

  const totalSelectableItems = useMemo(
    () => getTotalSelectableItemsCount(nodes, CheckModel[checkModel]),
    [nodes, checkModel],
  );

  const filterNodes = useCallback(
    (filtered: string[], node: ITreeNode) => {
      const children = (node.children || []).reduce(filterNodes, []);

      if (
        (node.label.toLocaleLowerCase().includes(inputValue.trim().toLocaleLowerCase()) &&
          (showSelected ? checkedOptionSet.has(node.value) : true)) ||
        children.length
      ) {
        filtered.push(node.value, ...children);
      }

      return filtered;
    },
    [inputValue, showSelected, checkedOptionSet],
  );

  const filteredOptions = useMemo(() => {
    if (!inputValue.trim() && !showSelected) return null;

    if (showSelected && onHandleSearch) {
      // Return all selected nodes for async search
      return new Set(Array.from(checkedOptionSet));
    }

    // Normal search behavior
    return new Set(nodes.reduce(filterNodes, []));
  }, [filterNodes, nodes, inputValue, showSelected, checkedOptionSet, onHandleSearch]);

  const resultsFound = filteredOptions === null || filteredOptions.size;

  const shouldRender = useCallback(
    (node) => {
      if (filteredOptions === null) return true;

      return filteredOptions.has(node.value);
    },
    [filteredOptions],
  );

  const allChecked = totalSelectableItems === checkedOptionSet?.size;

  const onSelectAll = useCallback(() => {
    const model = ref?.current?.getModel?.();
    model?.toggleAll?.(!allChecked, CheckModel[checkModel]);
    onSelect(model?.serializeListToValues?.() as string[]);
  }, [onSelect, allChecked]);

  const onSearchFeedbackReset = useCallback(() => {
    searchRef.current?.clear?.();
    setInputValue("");
  }, []);

  const handleSearch = (searchValue: string) => {
    if (onHandleSearch) {
      onHandleSearch(searchValue);
    } else {
      setInputValue(searchValue);
    }
  };

  return (
    <FilterWrapper id={`${composingID}-filter`} data-testid={dataTestId}>
      <FilterWrapperChild>
        <Search
          id={`${composingID}-search`}
          onChange={handleSearch}
          onSearch={handleSearch}
          placeholder={searchPlaceHolder || "Search Paramter"}
          ref={searchRef}
          debounceTimer={debounceTimer}
          {...(dataTestId && {
            testId: `${dataTestId}-search`,
          })}
        />
      </FilterWrapperChild>
      {isLoading ? (
        <LoaderContainer>
          <Loader />
        </LoaderContainer>
      ) : (
        <>
          <FilterWrapperChild data-gutter-free={(!!inputValue).toString()}>
            {!showSelected && !inputValue && (
              <>
                {!onHandleSearch ? (
                  <CheckboxWithLabel
                    label="Select All"
                    value="select_all"
                    id={`${composingID}-select_all`}
                    checked={allChecked}
                    indeterminate={checkedOptionSet?.size > 0 && !allChecked}
                    onChange={onSelectAll}
                    inputProps={{
                      // @ts-ignore
                      indeterminate: checkedOptionSet?.size > 0 && !allChecked,
                    }}
                  />
                ) : (
                  <span> Select </span>
                )}
                <Button
                  buttonType="inline"
                  onClick={() => setShowSelected(true)}
                  type="button"
                  SuffixIcon={ChevronRight}
                >
                  See Selected
                </Button>
              </>
            )}
            {showSelected && !inputValue && (
              <Button
                buttonType="inline"
                type="button"
                onClick={(): void => setShowSelected(false)}
                PrefixIcon={ChevronLeft}
              >
                See All
              </Button>
            )}
            {inputValue && (
              <SearchFeedback
                totalItemCount={1}
                foundItemCount={resultsFound ? 1 : 0}
                notFoundItemCount={resultsFound ? 0 : 1}
                foundItems={[inputValue]}
                notFoundItems={[inputValue]}
                onReset={onSearchFeedbackReset}
                width="100%"
              />
            )}
          </FilterWrapperChild>
          {!inputValue && (
            <Divider
              direction="horizontal"
              additionalStyles={{ borderColor: theme.color.stroke.primary }}
            />
          )}
          <CheckBoxTree
            id={`${composingID}`}
            selected={selected}
            onSelect={onSelect}
            nodes={
              onHandleSearch && showSelected
                ? Array.from(checkedOptionSet).map((value) => ({
                    value,
                    label: value,
                    id: value,
                  }))
                : nodes
            }
            shouldRender={shouldRender}
            ref={ref}
            checkModel={checkModel}
            {...(dataTestId && {
              dataTestId: `checkbox-tree-${dataTestId}`,
            })}
          />
        </>
      )}
    </FilterWrapper>
  );
};
