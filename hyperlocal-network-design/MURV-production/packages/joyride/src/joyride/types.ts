import { Props } from "react-joyride";

export interface ITourGuide extends Omit<Props, "tooltipComponent" | "styles"> {
  showSkipButton?: boolean;
}
