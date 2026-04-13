import styled, { css } from "styled-components";

export const TooltipWrapper = styled.div`
  cursor: pointer;
  position: relative;
  width: max-content;
  height: max-content;
`;

interface TooltipContainerProps {
  position: "top" | "bottom" | "left" | "right";
}

export const TooltipContainer = styled.div<TooltipContainerProps>`
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  position: absolute;
  text-wrap: wrap;
  width: max-content;
  max-width: 240px;
  max-height: 80px;

  ${({ position }) => {
    switch (position) {
      case "top":
        return css`
          bottom: 125%;
          left: 50%;
          transform: translateX(-50%);
        `;
      case "bottom":
        return css`
          top: 125%;
          left: 50%;
          transform: translateX(-50%);
        `;
      case "left":
        return css`
          right: 105%;
          top: 50%;
          transform: translateY(-50%);
        `;
      case "right":
        return css`
          left: 105%;
          top: 50%;
          transform: translateY(-50%);
        `;
      default:
        return css`
          bottom: 125%;
          left: 50%;
          transform: translateX(-50%);
        `;
    }
  }}

  z-index: ${({ theme }) => theme.murv.zIndex.level99};
  gap: ${({ theme }) => theme.murv.spacing.s};
  padding: ${({ theme }) => `${theme.murv.spacing.s} ${theme.murv.spacing.l}`};
  border-radius: ${({ theme }) => theme.murv.radius.s};
  background-color: ${({ theme }) => theme.murv.color.surface.inverse.default};
  box-shadow: ${({ theme }) => theme.murv.shadow.floating};
`;

export const TooltipText = styled.div`
  width: 100%;
  height: auto;

  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  overflow: hidden;
  text-overflow: clip;

  color: ${({ theme }) => theme.murv.color.text.inverse};
  font-size: ${({ theme }) => theme.murv.typography.subtext.s.size};
  font-weight: ${({ theme }) => theme.murv.typography.subtext.s.weight};
  line-height: ${({ theme }) => theme.murv.typography.subtext.s.lineHeight};
  letter-spacing: ${({ theme }) => theme.murv.typography.subtext.s.letterSpacing};
`;
