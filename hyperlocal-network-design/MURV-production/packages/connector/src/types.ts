export interface IConnectorProps {
  /**
   * Height of the connector component.
   */
  height?: string;

  /**
   * Width of the connector component.
   */
  width?: string;

  /**
   * connector Class to access the element
   */
  className?: string;

  /**
   * orientation
   */
  orientation?: "left" | "right";
}
