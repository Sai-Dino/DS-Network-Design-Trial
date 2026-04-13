import React from "react";
import { ILaunchModalMultimediaContent } from "../../types";
import { MultimediaContentResourceWrapper, MultimediaContentTextWrapper } from "./styles";

export const LaunchModalMultimediaContent: React.FC<ILaunchModalMultimediaContent> = ({
  primaryText,
  secondaryText,
  tertiaryText,
  link,
  dataTestId,
  ...resourceProps
}) => (
  <div data-testid={dataTestId}>
    <MultimediaContentResourceWrapper>
      {resourceProps.resourceType === "image" ? (
        <img src={resourceProps.resourceUrl} alt={resourceProps.resourceAltText} />
      ) : null}
      {resourceProps.resourceType === "video" ? (
        <video src={resourceProps.resourceUrl} controls>
          <track src={resourceProps.resourceCaptionsUrl} default kind="captions" srcLang="en" />
        </video>
      ) : null}
    </MultimediaContentResourceWrapper>
    <MultimediaContentTextWrapper>
      <strong>{primaryText}</strong>
      {secondaryText}
      <span>{tertiaryText}</span>
      {link}
    </MultimediaContentTextWrapper>
  </div>
);
