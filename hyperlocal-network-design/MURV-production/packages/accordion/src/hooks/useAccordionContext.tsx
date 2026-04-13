import React, { useMemo, createContext, useContext } from "react";
import { IAccordionContextProps } from "../types";

export const AccordionContext = createContext<IAccordionContextProps>({ accordionId: ''});

export const AccordionProvider: React.FC<IAccordionContextProps> = (props) => {
    const { accordionId, children } = props;

    const contextValue = useMemo(() => (
        { accordionId }
    ), [ accordionId]);

    return <AccordionContext.Provider value={contextValue}>{children}</AccordionContext.Provider>;
};

export const useAccordionContext = () => useContext(AccordionContext);
