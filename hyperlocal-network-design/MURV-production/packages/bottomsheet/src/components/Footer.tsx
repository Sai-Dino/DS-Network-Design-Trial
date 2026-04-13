import React from "react";
import { IDataTestIdProps } from "../types";
import { FooterWrapper } from "./styles";

export const BottomSheetFooter: React.FC<IDataTestIdProps> = ({ children, dataTestId }) => <FooterWrapper data-testid={dataTestId}>{children}</FooterWrapper>;
