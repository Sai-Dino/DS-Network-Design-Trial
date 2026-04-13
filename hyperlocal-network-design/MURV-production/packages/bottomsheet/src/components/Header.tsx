import React from "react";
import { IDataTestIdProps } from "../types";
import { HeaderWrapper } from "./styles";

export const BottomSheetHeader: React.FC<IDataTestIdProps> = ({ children, dataTestId }) => <HeaderWrapper data-testid={dataTestId}>{children}</HeaderWrapper>;
