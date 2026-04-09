import styled from "styled-components";
import { BottomSheet } from "./common/BottomSheet";
import { IBottomSheetProps } from "../types";

const breakpoint = {
  mobile: "768px",
};
export const RenderSheet: React.FC<IBottomSheetProps> = styled(BottomSheet)`
  @media (min-width: ${breakpoint.mobile}) {
    display: none;
  }
`;

export const CloseIconWrapper = styled.div`
  position: absolute;
  right: ${({ theme }) => theme.murv.spacing[0]};
  padding-right: ${({ theme }) => theme.murv.spacing.s};
`;
export const BackIconWrapper = styled.div``;
export const HeaderTitle = styled.div``;

export const HeaderWrapper = styled.div`
  display: flex;
  max-width: 360px;
  padding: ${({ theme }) => theme.murv.spacing.s};
  ${({ theme }) => theme.murv.spacing.xl};
  justify-content: flex-start;
  align-items: flex-start;
  gap: ${({ theme }) => theme.murv.spacing.l};
  border-radius: ${({ theme }) => theme.murv.radius[0]};
  background: ${({ theme }) => theme.murv.color.surface.neutral.default};
  flex-direction: row;
`;
export const ContentWrapper = styled.div`
  max-height: 424px;
  overflow-y: scroll;
  width: 100vw;
  padding: ${({ theme }) => theme.murv.spacing.l};
  ${({ theme }) => theme.murv.spacing.xl};
  overflow-wrap: break-word;
`;
export const FooterWrapper = styled.div`
  display: flex;
  width: 100%;
  padding: ${({ theme }) => theme.murv.spacing.l};
  ${({ theme }) => theme.murv.spacing.xl};
  justify-content: flex-end;
  align-items: center;
  align-content: center;
  gap: ${({ theme }) => theme.murv.spacing.l};
  flex-wrap: wrap;
  border-top: 1px solid ${({ theme }) => theme.murv.color.stroke.primary};
  background: ${({ theme }) => theme.murv.color.surface.neutral.default};
`;
