import React, { useState, useEffect } from "react";
import { Download, OpenInNew } from "@murv/icons";
import { StyledAnchor, IconWrapper } from "./styles";
import { LinkComponentProps } from "./types";
import { INTERNAL, EXTERNAL, STANDALONE, DEFAULT, PREESED, HOVERED, DISABLED } from "./constants";

/**
 * The Link component is a reusable UI element designed for creating hyperlinks within your application. It encapsulates the functionality to navigate between different views or external resources. This component abstracts the implementation details of navigation, providing a consistent and easily customizable way to create clickable links.
 */
export const Link = ({
  body,
  caption,
  linkType = INTERNAL,
  isDisabled = false,
  onClick = () => {},
  onHover = () => {},
  dataTestId = "",
  linkId = "",
  url,
  styles = {},
  ...props
}: LinkComponentProps) => {
  const [linkState, setLinkState] = useState<string>("");

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const getIcon = (linkType: string, isDisabled: boolean) => {
    if (linkType === EXTERNAL) {
      return isDisabled ? <OpenInNew size="13px" /> : <OpenInNew size="13px" />;
    }
    if (linkType === STANDALONE) {
      return isDisabled ? <Download size="13px" /> : <Download size="13px" />;
    }
    return null;
  };
  const icon = getIcon(linkType, isDisabled);

  if (!body && !caption) {
    return null;
  }

  const renderLinkText = () => {
    if (body) {
      return body;
    }
    if (caption) {
      return caption;
    }
    return null;
  };

  const onLinkClick = () => {
    setLinkState(PREESED);
    onClick();
  };
  const onLinkHover = () => {
    if (linkState !== PREESED) {
      setLinkState(HOVERED);
    }
    onHover();
  };
  const onLinkOut = () => {
    if (linkState !== PREESED) {
      setLinkState(DEFAULT);
    }
  };
  const renderAnchorLink = () => (
    <StyledAnchor
      href={url}
      target={linkType === EXTERNAL ? "_blank" : undefined}
      rel={linkType === EXTERNAL ? "noopener noreferrer" : undefined}
      onClick={onLinkClick}
      onMouseEnter={onLinkHover}
      onMouseLeave={onLinkOut}
      linkState={linkState}
      data-testid={dataTestId}
      id={linkId}
      styles={styles}
      caption={caption}
      {...props}
    >
      {renderLinkText()}
      <IconWrapper>{linkType !== INTERNAL && icon}</IconWrapper>
    </StyledAnchor>
  );

  useEffect(() => {
    if (isDisabled) {
      setLinkState(DISABLED);
    } else {
      setLinkState(DEFAULT);
    }
  }, []);

  return <>{renderAnchorLink()}</>;
};
