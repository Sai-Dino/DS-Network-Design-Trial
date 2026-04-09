import React from "react";
import { CheckCircle, Error, Warning, Info } from "@murv/icons";
import { useMURVContext } from "@murv/provider";
import { StatusType } from "./constants";

export const getIconByStatus = (status: keyof typeof StatusType) => {
  const { theme } = useMURVContext();
  switch (status) {
    case StatusType.success:
      return <CheckCircle color={theme.color.icon.success} />;
    case StatusType.error:
      return <Error color={theme.color.icon.danger} />;
    case StatusType.warning:
      return <Warning color={theme.color.icon.warning} />;
    case StatusType.information:
      return <Info color={theme.color.icon.information} />;
    default:
      return null;
  }
};
