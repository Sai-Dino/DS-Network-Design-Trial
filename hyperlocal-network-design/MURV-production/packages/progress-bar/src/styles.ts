 
import styled from "styled-components";
import { PROGRESS_BAR_VARIANTS } from "./constants";

export const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
  flex-direction: column;
  width: 100%;
  &[data-variant=${PROGRESS_BAR_VARIANTS.SYSTEMATIC}] {
    flex-direction: row;
  }
  `;
export const BarContainer = styled.div`
  display: flex;
  align-items: center;
  height: ${({ theme }) => theme.murv.spacing.xs};
  width: 100%;
  position: relative;
  border: ${({ theme }) => theme.murv.spacing[0]} solid ${({ theme }) => theme.murv.color.stroke.primary};
  border-radius: ${({ theme }) => theme.murv.spacing.xs};
  &[data-variant=${PROGRESS_BAR_VARIANTS.SYSTEMATIC}] {
    height: ${({ theme }) => theme.murv.spacing.xxxl};
    border: ${({ theme }) => theme.murv.spacing.xxxs} solid ${({ theme }) => theme.murv.color.stroke.primary};
  }
`;
export const BaseBox = styled.div`
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  border-radius: ${({ theme }) => theme.murv.spacing.xxs};
  transition: width 1s ease-in-out;
`;

export const Background = styled(BaseBox)`
  background: ${({ theme }) => theme.murv.color.stroke.secondary};
  width: 100%;
  &[data-variant=${PROGRESS_BAR_VARIANTS.SYSTEMATIC}] {
    background: ${({ theme }) => theme.murv.color.surface.neutral.default};
  }
`;

export const Progress = styled(BaseBox) <{ percent: number }>`
  background: ${({ theme }) => theme.murv.color.stroke.success};
  width: ${({ percent }) => percent}%;
`;
export const Label = styled.label`
  color: ${({ theme }) => theme.murv.color.text.primary};
  font-family: Inter;
  font-size: ${({ theme }) => theme.murv.typography.body.s.size};
  font-weight: ${({ theme }) => theme.murv.typography.subtext.s.weight};
`;
export const ValueText = styled.span`
  color: ${({ theme }) => theme.murv.color.text.primary};
  font-family: Inter;
  font-size: ${({ theme }) => theme.murv.typography.body.s.size};
  font-weight: ${({ theme }) => theme.murv.typography.body.sBold.weight};
`;

export const MainDispalyContainer = styled.div`
  z-index: ${({ theme }) => theme.murv.zIndex.level1};
  display: flex;
  align-items: center;
  flex-direction: row;
  width: 100%;
  justify-content: space-between;
  padding: ${({ theme }) => `${theme.murv.spacing.m} ${theme.murv.spacing[0]}`};
  &[data-variant=${PROGRESS_BAR_VARIANTS.SYSTEMATIC}] {
    position: absolute;
    padding: ${({ theme }) => `${theme.murv.spacing[0]} ${theme.murv.spacing.xxl}`};
  }
    `;
export const LeftDisplayContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: ${({ theme }) => theme.murv.spacing.m};
`;
export const ProgressElement = styled.progress`
  position: absolute;
  height: 0;
  visibility: hidden;
`;
