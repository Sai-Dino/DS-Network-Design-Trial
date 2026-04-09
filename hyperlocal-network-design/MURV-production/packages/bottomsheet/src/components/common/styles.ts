import styled, { keyframes } from "styled-components";

export const slideIn = keyframes`
from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
`;

export const BottomSheetContainer = styled.div`
  display: inline-flex;
  max-height: 584px;
  padding-top: ${({ theme }) => theme.murv.spacing.s};
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.murv.spacing[0]};
  flex-shrink: ${({ theme }) => theme.murv.spacing[0]};
  border-radius: ${({ theme }) => `${theme.murv.radius.xxl} ${theme.murv.radius.xxl}
     ${theme.murv.radius[0]} ${theme.murv.radius[0]}`};
  background: ${({ theme }) => theme.murv.color.surface.neutral.default};
  position: fixed;
  bottom: ${({ theme }) => theme.murv.spacing[0]};
  left: ${({ theme }) => theme.murv.spacing[0]};
  right: ${({ theme }) => theme.murv.spacing[0]};
  z-index: ${({ theme }) => theme.murv.zIndex.level1};
  animation: ${slideIn} 0.5s ease-out;
  box-shadow: 0px 4px 8px 4px rgba(0, 0, 0, 0.08);

  .open {
    transform: translateY(0);
  }
  .no-scroll {
    overflow: hidden;
  }
  .drag-handle {
    height: ${({ theme }) => theme.murv.spacing.xxs};
    width: 32px;
    cursor: grab;
    border-radius: 2.5px;
    background:${({ theme }) => theme.murv.color.surface.inverse.pressed};
  }
  .drag-handle:active {
    cursor: grabbing;
  }
`;

export const LineContainer = styled.div`
  position: relative;
  width: 32px;
  height: 4px;
  border-radius: 2.5px;
  background: ${({ theme }) => theme.murv.color.surface.neutral.pressed};
  left: 50%;
`;
