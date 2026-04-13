import React from "react";
import { Info } from "@murv/icons";

interface IconProps {
  id: "info-icon" | "info-icon-dark";
}

export const Icon: React.FC<IconProps> = ({ id }) => {
  switch (id) {
    case "info-icon":
      return <Info color="white" />;
    case "info-icon-dark":
      return <Info color="black" />;
    default:
      return <>👻</>;
  }
};
