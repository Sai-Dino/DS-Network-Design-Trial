import React, { useState } from "react";
import { BottomSheet } from "../components";

export const BottomSheetStory = (args) => {
  const [open, setOpen] = useState(false);
  const { HeaderProps, ContentProps, ActionsProps } = args;
  return (
    <div>
      <button type="button" data-testid="bottomsheet-button" onClick={() => setOpen(true)}>
        Open Bottomsheet
      </button>
      <BottomSheet isOpen={open} setOpen={() => setOpen(false)} dataTestId="bottom-sheet-component">
        <BottomSheet.Header dataTestId="bottom-sheet-header">
          <BottomSheet.Header.BackNavigation onBack={() => {}} />
          <BottomSheet.Header.Title dataTestId="bottom-sheet-title">
            {HeaderProps.titleProps}
          </BottomSheet.Header.Title>
          <BottomSheet.Header.CloseIcon closeSheet={() => setOpen(false)} />
        </BottomSheet.Header>
        <BottomSheet.Content dataTestId="bottom-sheet-content">{ContentProps}</BottomSheet.Content>
        <BottomSheet.Footer dataTestId="bottom-sheet-footer">{ActionsProps}</BottomSheet.Footer>
      </BottomSheet>
    </div>
  );
};
