import React from "react";
import { IconNames } from "../types";

import { Failure } from "./Failure";
import { Celebrate } from "./Celebrate";
import { Error404 } from "./Error404";
import { Info } from "./Info";
import { NetworkError } from "./NetworkError";
import { NoAccess } from "./NoAccess";
import { NoResults } from "./NoResults";
import { SomethingWentWrong } from "./SomethingWentWrong";
import { Success } from "./Sucess";
import { UnderConstruction } from "./UnderConstruction";
import { ICONS } from "../constants";

interface IconProps {
  id: IconNames;
}

// TODO: Temporary way to use icons. Remove this when Icon solve is implemented
export const Icon: React.FC<IconProps> = ({ id }) => {
  switch (id) {
    case ICONS.FAILURE:
      return Failure;
    case ICONS.ERROR_404:
      return Error404;
    case ICONS.SUCCESS:
      return Success;
    case ICONS.INFO:
      return Info;
    case ICONS.NETWORK_ERROR:
      return NetworkError;
    case ICONS.NO_ACCESS:
      return NoAccess;
    case ICONS.NO_RESULTS:
      return NoResults;
    case ICONS.SOMETHING_WENT_WRONG:
      return SomethingWentWrong;
    case ICONS.UNDER_CONSTRUCTION:
      return UnderConstruction;
    case ICONS.CELEBRATE:
      return Celebrate;
    default:
      return null;
  }
};
