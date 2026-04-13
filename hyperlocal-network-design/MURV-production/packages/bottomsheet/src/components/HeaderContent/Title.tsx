import React from "react";
import { IDataTestIdProps } from "../../types";
import { HeaderTitle } from "../styles";

export const Title: React.FC<IDataTestIdProps> = ({ children ,dataTestId}) => <HeaderTitle data-testid={dataTestId}>{children}</HeaderTitle>;
