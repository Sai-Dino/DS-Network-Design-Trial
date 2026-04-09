import React from "react";
import { ConnectorWrapper } from "./styles";
import { IConnectorProps } from "./types";

const Connector: React.FC<IConnectorProps> = ({
  height = "8px",
  width = "8px",
  className = "",
  orientation = "left",
}) => (
  <ConnectorWrapper height={height} width={width} className={className} orientation={orientation} />
);
export default Connector;
