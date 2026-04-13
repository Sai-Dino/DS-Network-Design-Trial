import styled from "styled-components";
import { ToastContainer } from "react-toastify";

const breakpoint = {
  mobile: "480px",
};

export const CustomToastContainer = styled(ToastContainer)`
  &&&.Toastify__toast-container {
    padding: ${({ theme }) => theme.murv.spacing[0]};
    width: auto;
  }
  .Toastify__toast {
    display: flex;
    width: 420px;
    min-width: 420px;
    max-width: 420px;
    min-height: 60px;
    max-height: 60px;
    padding: ${({ theme }) => theme.murv.spacing.s};
    cursor: default;
    box-shadow: unset;
    background-color: transparent;

    @media (max-width: ${breakpoint.mobile}) {
      width: 360px;
      min-width: 360px;
      max-width: 360px;
    }
  }
  .Toastify__toast-body {
    padding: ${({ theme }) => theme.murv.spacing[0]};
  }
  :root {
    --toastify-toast-width: 100%;
  }
`;

export const ContentWrapper = styled.div`
  display: flex;
  align-items: center;
  align-content: center;
  flex-wrap: wrap;
  flex: 1 0 0;
  max-height: 44px;
  border-radius: ${({ theme }) => theme.murv.radius.xxl};
  padding: ${({ theme }) => theme.murv.spacing.l};
  gap: ${({ theme }) => theme.murv.spacing.l};
  box-shadow: ${({ theme }) => theme.murv.shadow.floating};
  &.success {
    border: 2px solid ${({ theme }) => theme.murv.color.stroke.success};
    background: ${({ theme }) => theme.murv.color.surface.success.default};
  }

  &.error {
    border: 2px solid ${({ theme }) => theme.murv.color.stroke.dangerlight};
    background: ${({ theme }) => theme.murv.color.surface.danger.default};
  }

  &.warning {
    border: 2px solid ${({ theme }) => theme.murv.color.stroke.warning};
    background: ${({ theme }) => theme.murv.color.surface.warning.default};
  }

  &.information {
    border: 2px solid ${({ theme }) => theme.murv.color.stroke.selected};
    background: ${({ theme }) => theme.murv.color.surface.information.default};
  }
`;

export const Message = styled.div`
  max-height: 40px;
  flex: 1 0 0;
  color: ${({ theme }) => theme.murv.color.text.primary};
  font-size: ${({ theme }) => theme.murv.typography.body.sBold.size};
  font-weight: ${({ theme }) => theme.murv.typography.body.sBold.weight};
  line-height: ${({ theme }) => theme.murv.typography.body.sBold.lineHeight};
  overflow: hidden;
  textoverflow: "ellipsis";
`;

export const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
`;
