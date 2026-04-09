import styled from "styled-components";

export const Container = styled.div<{ width?: string; height?: string }>`
  width: ${(props) => props.width || "280px"};
  height: ${(props) => props.height || "336px"};
  overflow: hidden;
  border-radius: ${(props) => props.theme.murv.radius.s};
  border: ${(props) => `1px solid ${props.theme.murv.color.stroke.primary}`};
  background: ${(props) => props.theme.murv.color.surface.neutral.default};
  box-shadow: 0px 4px 8px 4px rgba(0, 0, 0, 0.08);
`;

export const ScrollableSection = styled.div<{ trimHeight?: boolean }>`
  height: ${(props) => (props.trimHeight ? "calc(100% - 40px)" : "100%")};
  overflow-y: scroll;
  scrollbar-width: none;
`;

export const ButtonSection = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  border-bottom-left-radius: ${(props) => props.theme.murv.radius.s};
  border-bottom-right-radius: ${(props) => props.theme.murv.radius.s};
`;
