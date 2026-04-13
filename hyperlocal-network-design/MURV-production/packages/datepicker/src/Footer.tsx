import React, { KeyboardEventHandler, MouseEventHandler } from "react";
import { Button } from "@murv/button";
import { FooterContainer } from "./styles";
import { IMonthGridProps } from "./types";

const Footer = ({
  onFooterClick,
  onDone,
  onCancel,
}: { onFooterClick: MouseEventHandler | KeyboardEventHandler } & Pick<
  IMonthGridProps,
  "onDone" | "onCancel"
>) =>
  onDone || onCancel ? (
    <FooterContainer
      onClick={onFooterClick as MouseEventHandler}
      onKeyDown={onFooterClick as KeyboardEventHandler}
    >
      {onCancel && (
        <Button
          data-action="cancel"
          buttonStyle="brand"
          buttonType="tertiary"
          size="large"
          type="reset"
        >
          Cancel
        </Button>
      )}
      {onDone && (
        <Button
          data-action="done"
          buttonStyle="brand"
          buttonType="tertiary"
          size="large"
          type="submit"
        >
          Done
        </Button>
      )}
    </FooterContainer>
  ) : null;

export default Footer;
