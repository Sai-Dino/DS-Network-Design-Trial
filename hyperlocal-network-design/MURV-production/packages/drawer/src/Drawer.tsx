import React, { useEffect, useRef } from "react";
import type { IDialogElementRef } from "@murv/core/components/dialog";
import isValidChildren from "@murv/core/utils/validate-children";
import { createPortal } from "react-dom";
import { IDrawerComponent, TDrawer } from "./types";
import { DrawerWrapper, StyledDialog } from "./styles";
import { DrawerHeader } from "./components/DrawerHeader";
import { DrawerContent } from "./components/DrawerContent";
import { DrawerFooter } from "./components/DrawerFooter";
import { DrawerProvider } from "./provider/DrawerProvider";

const Drawer: IDrawerComponent = ({
  id,
  show = false,
  dataTestId,
  children,
  drawerContainerWidth,
  drawerContainerMaxWidth = 800,
  closeDrawer,
  shouldCloseOnOverlayClick = false,
}: React.PropsWithChildren<TDrawer>) => {
  const { isValid: isValidDrawerHeader, validChildren: drawerHeader } = isValidChildren({
    allowedTypes: [DrawerHeader],
    expectedChildrenCount: 1,
  })(children);

  const { isValid: isValidDrawerConent, validChildren: drawerContent } = isValidChildren({
    allowedTypes: [DrawerContent],
    expectedChildrenCount: 1,
  })(children);
  if (!isValidDrawerHeader || !isValidDrawerConent) {
    console.error("Drawer component must have a DrawerHeader and a DrawerContent..");
    return null;
  }
  const { validChildren: drawerFooter } = isValidChildren({
    allowedTypes: [DrawerFooter],
    expectedChildrenCount: 1,
  })(children);

  const dialogRef = useRef<IDialogElementRef>(null);
  const drawerContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dialogRef?.current) {
      if (show) {
        dialogRef.current.show();
      } else {
        dialogRef.current.close();
      }
    }
  }, [show]);

  // Handle outside click to close drawer
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      // Check if the drawer is open and closeOnOutsideClick is enabled
      if (show && shouldCloseOnOverlayClick && drawerContentRef.current) {
        if (!drawerContentRef.current.contains(event.target as HTMLElement)) {
          closeDrawer();
        }
      }
    };

    if (shouldCloseOnOverlayClick && show) {
      // Add a small delay to prevent immediate closing when the drawer opens
      const timeoutId = setTimeout(() => {
        document.addEventListener("click", handleOutsideClick);
      }, 300);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("click", handleOutsideClick);
      };
    }

    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [show, shouldCloseOnOverlayClick, closeDrawer]);

  return createPortal(
    <StyledDialog
      dataTestId={`modal-${dataTestId}`}
      id={id}
      ref={dialogRef}
      onClose={closeDrawer}
      ariaLabelledBy={`${id}-dialog-header`}
      ariaDescribedBy={`${id}-dialog-content`}
      mode="modal"
      width={drawerContainerWidth}
      maxWidth={drawerContainerMaxWidth}
      show={show}
    >
      <DrawerProvider id={id} dataTestId={dataTestId} closeDrawer={closeDrawer}>
        <DrawerWrapper data-testid={dataTestId} ref={drawerContentRef}>
          {drawerHeader}
          {drawerContent}
          {drawerFooter}
        </DrawerWrapper>
      </DrawerProvider>
    </StyledDialog>,
    document.body,
  );
};

Drawer.Header = DrawerHeader;
Drawer.Content = DrawerContent;
Drawer.Footer = DrawerFooter;

export default Drawer;
