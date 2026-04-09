import React, { useCallback } from "react";
import Joyride, { ACTIONS, EVENTS, LIFECYCLE, STATUS, TooltipRenderProps } from "react-joyride";
import { useMURVContext } from "@murv/provider";
import { JoyrideTooltip } from "../joyride-tooltip";
import { ITourGuide } from "./types";

export { ACTIONS, EVENTS, LIFECYCLE, STATUS };

export const TourGuide = ({ showSkipButton, ...props }: ITourGuide) => {
  const { theme } = useMURVContext();

  const renderToolTIpComponent = useCallback(
    (toolTipprops: TooltipRenderProps): React.JSX.Element => (
      <JoyrideTooltip {...toolTipprops} showSkipButton={showSkipButton} />
    ),
    [showSkipButton],
  );

  return (
    <Joyride
      tooltipComponent={renderToolTIpComponent}
      styles={{
        options: { arrowColor: theme.color.surface.brand.default, beaconSize: 20 },
        beacon: {
          background: "transparent",
        },
        beaconInner: {
          backgroundColor: theme.color.surface.brand.default,
        },
        beaconOuter: {
          border: `1px solid ${theme.color.surface.brand.default}`,
          backgroundColor: theme.color.surface.brand.hover,
        },
      }}
      {...props}
    />
  );
};

export default TourGuide;
