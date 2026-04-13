import styled, { css } from "styled-components";

export const SliderTrack = styled.div``;

export const Handler = styled.div<{ positionX: number; display: string }>`
  position: absolute;
  left: ${({ positionX }) => `${positionX - 5}px`};
  background: ${({ theme }) => theme.murv.color.surface.brand.default};
  width: ${({ theme }) => theme.murv.spacing.xxl};
  height: ${({ theme }) => theme.murv.spacing.xxl};
  border-radius: ${({ theme }) => theme.murv.radius.xxl};
  z-index: ${({ theme }) => theme.murv.zIndex.level1};
  bottom: -${({ theme }) => theme.murv.spacing.xs};
  display: ${({ display = "block" }) => display};
`;

export const BaseSliderLine = styled.div`
  background: ${({ theme }) => theme.murv.color.surface.selected.hover};
  border-radius: ${({ theme }) => theme.murv.spacing.m};
  width: 100%;
  height: ${({ theme }) => theme.murv.spacing.s};
  cursor: pointer;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
`;

export const CircleSvg = styled.svg`
  position: absolute;
  z-index: ${({ theme }) => theme.murv.zIndex.level1};
`;

export const LineSvg = styled.svg`
  position: relative;
`;

export const SliderContainer = styled.div<{ width: number }>`
  position: relative;
  cursor: pointer;
  width: ${({ width }) => `${width}px` || "200px"};
  display: flex;
  flex-wrap: wrap;
  align-items: center;
`;

export const TrackLine = styled.span<{ width: number; left?: number; right?: number }>`
  display: block;
  position: absolute;
  height: ${({ theme }) => theme.murv.spacing.m};
  border-radius: ${({ theme }) => theme.murv.spacing.m};
  background-color: ${({ theme }) => theme.murv.color.stroke.brand};
  width: ${({ width }) => `${width}px`};
  left: ${({ left }) => `${left}px`};
  //opacity: ${({ theme }) => theme.murv.opacity.disabled};
  ${({ left, right }) => {
    if (left) {
      return css`
        left: ${left}px;
      `;
    }
    return css`
      right: ${right}px;
    `;
  }}
`;

export const InputContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.murv.spacing.m};
`;

export const SliderRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.murv.spacing.m};
`;
