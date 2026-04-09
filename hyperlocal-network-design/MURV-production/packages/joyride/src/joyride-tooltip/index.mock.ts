import { ITourGuidTooltip } from "./JoyrideTooltip";

const base: ITourGuidTooltip = {
  showSkipButton: false,
  continuous: true,
  index: 0,
  isLastStep: false,
  setTooltipRef: () => {},
  size: 1,
  step: {
    title: "Title Place",
    content: "Content Place",
    target: ".test",
    hideFooter: false,
  },
  backProps: {
    "aria-label": "",
    "data-action": "",
    onClick: () => {},
    role: "",
    title: "",
  },
  closeProps: {
    "aria-label": "",
    "data-action": "",
    onClick: () => {},
    role: "",
    title: "",
  },
  primaryProps: {
    "aria-label": "",
    "data-action": "",
    onClick: () => {},
    role: "",
    title: "",
  },
  skipProps: {
    "aria-label": "",
    "data-action": "",
    onClick: () => {},
    role: "",
    title: "",
  },
  tooltipProps: {
    "aria-modal": true,
    ref: () => {},
    role: "",
  },
};

const withGif = {
  ...base,
};
const withOutTitle = {
  ...base,
  step: {
    ...base.step,
    title: "",
  },
};

export default {
  base,
  withGif,
  withOutTitle,
};
