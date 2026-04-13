import styled from "styled-components";

const breakpoint = {
  mobile: "480px",
};

export const Container = styled.div<{ isScroll: boolean, paddingVertical?: number, paddingHorizontal?: number, gap?: number }>`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-direction: row;
  width: 100%;
  border: 0px;
  padding: ${({ theme, paddingVertical }) => paddingVertical ? `${paddingVertical}px` : theme.murv.spacing.xxs} ${({ theme, paddingHorizontal }) => paddingHorizontal ? `${paddingHorizontal}px` : theme.murv.spacing.xxxl};
  gap: ${({ theme, gap }) => gap ? `${gap}px` : theme.murv.spacing.l};    
  flex-wrap: ${({ isScroll }) => !isScroll && 'wrap'};
  @media (max-width: ${breakpoint.mobile}) {
    padding: ${({ theme, paddingVertical }) => paddingVertical ? `${paddingVertical}px` : theme.murv.spacing.xxs} ${({ theme, paddingHorizontal }) => paddingHorizontal ? `${paddingHorizontal}px` : theme.murv.spacing.xl};
  }
`;