import React, { useMemo, createContext, useContext } from "react";
import { TDrawerContext } from "../types";

export const DrawerContext = createContext<TDrawerContext>({
  id: "",
  dataTestId: "",
  closeDrawer: () => {},
});

export const useDrawerContext = () => useContext(DrawerContext);

export const DrawerProvider: React.FC<TDrawerContext> = (props) => {
  const { id, dataTestId, closeDrawer, children } = props;

  const contextValue = useMemo(
    () => ({ id, dataTestId, closeDrawer }),
    [id, dataTestId, closeDrawer],
  );

  return <DrawerContext.Provider value={contextValue}>{children}</DrawerContext.Provider>;
};
