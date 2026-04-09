import styled from "styled-components";

export const ConnectorWrapper = styled.div<{ height: string; width: string; orientation: string }>`
  height: ${({ height }) => height};
  width: ${({ width }) => width};
  min-width: ${({ theme }) => theme.murv.spacing.s};
  min-height: ${({ theme }) => theme.murv.spacing.s};
  border-bottom: 1px solid ${({ theme }) => theme.murv.color.stroke.primary};
  border-left: 1px solid ${({ theme }) => theme.murv.color.stroke.primary};
  transform: scaleX(${({ orientation }) => (orientation === "left" ? 1 : -1)});
`;
