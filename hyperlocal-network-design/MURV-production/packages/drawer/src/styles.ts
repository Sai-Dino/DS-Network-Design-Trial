import styled, { keyframes } from "styled-components";
import { Dialog } from "@murv/core/components/dialog";

// TODO: Replace with theme token
const breakpoint = {
  mobile: "480px",
};

const slideInAnimation = keyframes`
from {
  transform: translateX(100%);
  opacity: 0;
}
to {
  transform: translateX(0%);
  opacity: 1;
}
`;

const slideOutAnimation = keyframes`
from {
  transform: translateX(100%);
  opacity: 1;
}
to {
  transform: translateX(0%);
  opacity: 0;
}
`;

export const DrawerWrapper = styled.div`
  width: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.murv.color.surface.neutral.default};
  padding: ${({ theme }) => `${theme.murv.spacing.l}`};
`;

export const ContainerArea = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.murv.color.surface.neutral.default};
  height: 100%;
  flex: 1 0 0;
  align-items: center;
  align-self: stretch;
  padding: ${({ theme }) => `${theme.murv.spacing.l}`};
  gap: ${({ theme }) => theme.murv.spacing.s};
  overflow: auto;
`;

export const HeaderArea = styled.div`
  display: flex;
  padding: ${({ theme }) => `${theme.murv.spacing.s}`};
  width: 100%;
  justify-content: flex-end;
  align-items: center;
  gap: ${({ theme }) => theme.murv.spacing.l};

  & #murv-drawer-close-action > span {
    pointer-events: none;
  }
`;

export const HeaderTitleContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${({ theme }) => theme.murv.spacing.l};
  flex: 1 0 0;

  & .drawer-icon {
    color: ${({ theme }) => theme.murv.color.icon.selected};
  }
`;

export const HeaderTitleArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.murv.spacing.s};
`;

export const IconWrapper = styled.div`
  display: flex;
  flex-shrink: 0;
`;

export const HeaderTitle = styled.span`
  line-height: ${({ theme }) => theme.murv.typography.subtext.s.lineHeight};
  color: ${({ theme }) => theme.murv.color.text.primary};
  font-weight: ${({ theme }) => theme.murv.typography.heading.m.weight};
  font-size: ${({ theme }) => theme.murv.typography.heading.s.size};
  letter-spacing: ${({ theme }) => theme.murv.typography.heading.s.letterSpacing};
  color: ${({ theme }) => theme.murv.color.text.primary};
`;

export const HeaderSecondaryTitle = styled.span`
  text-overflow: ellipsis;
  overflow: hidden;
  line-height: ${({ theme }) => theme.murv.typography.body.s.lineHeight};
  color: ${({ theme }) => theme.murv.color.text.secondary};
  font-size: ${({ theme }) => theme.murv.typography.body.s.size};
  letter-spacing: ${({ theme }) => theme.murv.typography.body.s.letterSpacing};
`;

export const FooterArea = styled.div`
  display: flex;
  align-self: stretch;
  align-items: center;
  align-content: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.murv.spacing.s};
  padding: ${({ theme }) => `${theme.murv.spacing.l} ${theme.murv.spacing.s}`};
  flex-wrap: wrap;
  @media (max-width: ${breakpoint.mobile}) {
    justify-content: center;
  }
`;

export const StyledDialog = styled(Dialog)<{ width: number; show: boolean; maxWidth: number }>`
  padding: 0;
  border-radius: 0;
  float: right;
  margin-right: 0;
  align-self: stretch;
  width: ${(props) => (props.width ? `${props.width}px` : "520px")};
  min-height: 100%;
  min-width: 520px;
  max-width: ${(props) => (props.maxWidth ? `${props.maxWidth}px` : "800px")};
  background-color: ${({ theme }) => theme.murv.color.surface.neutral.default};
  boxshadow: none;

  .dialog-focus-trap {
    width: 100%;
    height: 100%;
  }

  @media (max-width: ${breakpoint.mobile}) {
    min-width: 100%;
    max-width: 100%;
  }

  &[open] {
    height: 100%;
    animation: ${slideInAnimation} 0.3s ease-out;
  }

  &[close] {
    animation: ${slideOutAnimation} 0.3s ease-out;
  }
`;
