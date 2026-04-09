import React from "react";
import { Home, ChevronRight, MoreHoriz } from "@murv/icons";

interface IconProps {
  id: "home-icon-id" | "base-separator-icon-id" | "truncate-icon-id" | string;
}

export const Icon: React.FC<IconProps> = ({ id }) => {
  switch (id) {
    case "home-icon-id":
      return <Home className="breadcrumb-icon" />;
    case "base-separator-icon-id":
      return <ChevronRight className="breadcrumb-icon" />
    case "truncate-icon-id":
      return <MoreHoriz className="breadcrumb-icon" />;

    default:
      return <>👻</>;
  }
};
