import React from "react";
import { CheckCircle, Error, Warning, Info } from "@murv/icons"
import { useMURVContext } from "@murv/provider";
import { StatusType } from "./constants";

export const getIconByStatus = (status: keyof typeof StatusType) => {
  const { theme } = useMURVContext();
  switch (status) {
    case StatusType.success:
      return <CheckCircle fill color={theme.color.icon.success} />;
    case StatusType.error:
      return <Error fill color={theme.color.icon.danger} />;
    case StatusType.warning:
      return <Warning fill color={theme.color.icon.warning} />;
    case StatusType.information:
      return <Info fill color={theme.color.icon.information} />;
    default:
      return null;
  }
};