import styled from "styled-components";

export const CarouselHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.murv.spacing.l};
  flex: 1 0 0;
`;

export const HeaderText = styled.div`
  color: ${({ theme }) => theme.murv.color.icon.primary}
  font-size: ${({ theme }) => theme.murv.typography.body.sBold.size};
  font-weight: ${({ theme }) => theme.murv.typography.body.sBold.weight};
  line-height: ${({ theme }) => theme.murv.typography.body.sBold.lineHeight}
`;

export const CarouselContainer = styled.div<{ width: string; backgroundColor: string }>`
  display: flex;
  flex-direction: column;
  position: relative;
  width: ${(props) => props.width};
  overflow: hidden;
  padding: ${({ theme }) => theme.murv.spacing.xl};
  gap: ${({ theme }) => theme.murv.spacing.s};
  background-color: ${({ backgroundColor }) => backgroundColor};
  border-radius: ${({ theme }) => theme.murv.radius.s};
`;

export const ContentWindow = styled.div<{ spacing: number }>`
  display: flex;
  position: relative;
  flex: 1;
  transition: transform 0.5s ease-in-out;
  gap: ${({ spacing }) => `${spacing}px`};
`;

export const ContentContainer = styled.div`
  display: flex;
  overflow: hidden;
`;

export const Content = styled.div<{ width: number; height: number }>`
  width: ${(props) => `${props.width}px`};
  height: ${(props) => `${props.height}px`};
  flex: 0 0 ${(props) => `${props.width}px`};
  border-radius: ${({ theme }) => theme.murv.spacing.s};
`;

export const PaginationContainer = styled.div<{ position: string }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.murv.spacing.l};
  ${(props) => {
    switch (props.position) {
      case "top-right":
        return "margin-left: auto;";
      case "bottom-left":
        return "margin-right: auto;";
      case "bottom-center":
        return "margin: auto;";
      case "bottom-right":
        return "margin-left: auto;";
      default:
        return "";
    }
  }}
`;
