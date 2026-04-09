import React, { useRef } from "react";
import Draggable from "react-draggable";
import { createPortal } from "react-dom";
import { BottomSheetContainer, LineContainer } from "./styles";
import { IBottomSheetProps } from "../../types";

export const BottomSheet: React.FC<IBottomSheetProps> = ({
  isOpen = false,
  setOpen,
  children,
  dataTestId,
}) => {
  const minHeight = 176;
  const maxHeight = 584;
  const contentRef = useRef<HTMLDivElement>(null);

  const handleStop = () => {
    setOpen();
  };

  if (!isOpen) return null;

  return createPortal(
    <Draggable
      axis="y"
      handle=".drag-handle"
      bounds={{ top: 0, bottom: maxHeight - minHeight }}
      onStop={handleStop}
    >
      <BottomSheetContainer className={`${isOpen ? "open" : ""}`} data-testid={dataTestId}>
        <LineContainer>
          <div className="drag-handle" />
        </LineContainer>
        <div ref={contentRef}>{children}</div>
      </BottomSheetContainer>
    </Draggable>,
    document.body,
  );
};
