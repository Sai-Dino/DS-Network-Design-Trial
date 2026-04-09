import React, { createContext, useContext, useEffect, useMemo } from "react";
import { IPillsBarProvider, IPillsBarContext } from "../types";

const PillsContext = createContext<IPillsBarContext>({
  onSelect: () => {},
  isPrefixReplaceable: false,
  selectedPills: [] || "",
});

export const usePillsBarContext = () => useContext(PillsContext);

export const PillBarProvider: React.FC<IPillsBarProvider> = ({
  isMultiSelect = false,
  isPrefixReplaceable = false,
  selectedPills = [] || "",
  children,
  onSelectedChange = () => {},
}) => {
  useEffect(() => {
    if (selectedPills) {
      if (isMultiSelect && !Array.isArray(selectedPills)) {
        console.error("Multiselect must have array of selected pills");
      }
    }
  }, [selectedPills]);

  const onSelect = (pillId: string) => {
    if (isMultiSelect) {
      if (selectedPills.includes(pillId)) {
        onSelectedChange([...selectedPills].filter((id) => id !== pillId));
        return;
      }
      onSelectedChange([...selectedPills, pillId]);
      return;
    }
    onSelectedChange(pillId);
  };

  const contextValue = useMemo(
    () => ({ selectedPills, onSelect, isPrefixReplaceable }),
    [selectedPills],
  );

  return <PillsContext.Provider value={contextValue}>{children}</PillsContext.Provider>;
};
