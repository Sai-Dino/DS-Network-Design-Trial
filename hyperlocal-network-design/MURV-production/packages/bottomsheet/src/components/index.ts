import { RenderSheet } from "./styles";
import { BottomSheetHeader } from "./Header";
import { BottomSheetContent } from "./Content";
import { BottomSheetFooter } from "./Footer";
import { CloseIcon } from "./HeaderContent/CloseButton";
import { BackNavigation } from "./HeaderContent/BackButton";
import { Title } from "./HeaderContent/Title";

const BottomSheetHeaderContent = {
  BackNavigation,
  Title,
  CloseIcon,
};

const BottomSheetComponents = {
  Header: Object.assign(BottomSheetHeader, BottomSheetHeaderContent),
  Content: BottomSheetContent,
  Footer: BottomSheetFooter,
  displayName: "BottomSheet",
};

export const BottomSheet = Object.assign(RenderSheet, BottomSheetComponents);
