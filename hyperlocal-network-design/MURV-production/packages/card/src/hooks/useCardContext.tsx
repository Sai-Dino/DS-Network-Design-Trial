import React, { useMemo, createContext, useContext } from "react";
import { ICardContextProps } from "../types";

export const CardContext = createContext<ICardContextProps>({});

export const CardProvider: React.FC<ICardContextProps> = (props) => {
  const { interactable, disabled, id, testId, children } = props;

  const contextValue = useMemo(
    () => ({ interactable, disabled, id, testId }),
    [interactable, disabled, id, testId],
  );

  return <CardContext.Provider value={contextValue}>{children}</CardContext.Provider>;
};

export const useCardContext = () => useContext(CardContext);
