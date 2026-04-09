import React from "react";
import { IDataTestIdProps } from "../types";
import { ContentWrapper } from "./styles";

export const BottomSheetContent: React.FC<IDataTestIdProps> = ({ children, dataTestId }) => <ContentWrapper data-testid={dataTestId}>{children}</ContentWrapper>;
