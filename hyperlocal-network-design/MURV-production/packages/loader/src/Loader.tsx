import React from "react";
import { useTheme } from "styled-components";
import { LoaderProps } from "./types";

/**
 * A loader is used to show a loading state of a component.
 */
const Loader: React.FC<LoaderProps> = ({ id, dataTestId, customColor }) => {
  const theme = useTheme();
  const color = customColor || theme.murv.color.surface.brand.default;
  return (
    <svg x="0" y="0" viewBox="0 0 52 18" width="20px" data-testid={dataTestId} id={id}>
      <circle fill={color} stroke="none" cx="6" cy="9" r="6">
        <animate
          attributeName="opacity"
          dur="1s"
          values="0;1;0"
          repeatCount="indefinite"
          begin="0.1"
        />
      </circle>
      <circle fill={color} stroke="none" cx="26" cy="9" r="6">
        <animate
          attributeName="opacity"
          dur="1s"
          values="0;1;0"
          repeatCount="indefinite"
          begin="0.2"
        />
      </circle>
      <circle fill={color} stroke="none" cx="46" cy="9" r="6">
        <animate
          attributeName="opacity"
          dur="1s"
          values="0;1;0"
          repeatCount="indefinite"
          begin="0.3"
        />
      </circle>
    </svg>
  );
};

export default Loader;
