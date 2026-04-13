import styled from "styled-components";

// Styled components
export const FlexColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

export const Container = styled(FlexColumn)`
  padding: ${({ theme }) => theme.murv.spacing.xxl};
`;

export const GroupContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.murv.spacing.xxl};
`;

export const GroupTitle = styled.h3`
  margin-left: ${({ theme }) => theme.murv.spacing.m};
  margin-bottom: ${({ theme }) => theme.murv.spacing.m};
  font-size: 1.5em;
  color: #333;
`;

export const ColorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: ${({ theme }) => theme.murv.spacing.xxl};
  padding: ${({ theme }) => theme.murv.spacing.m};
`;

export const ColorBoxContainer = styled(FlexColumn)`
  align-items: center;
  text-align: center;
`;

export const Box = styled(FlexColumn)<{
  width?: string;
  height?: string;
  bgColor?: string;
  borderRadius?: string;
  boxShadow?: string;
}>`
  width: ${({ width }) => width || "100px"};
  height: ${({ height }) => height || "100px"};
  background-color: ${({ bgColor }) => bgColor || "#f0f0f0"};
  border-radius: ${({ borderRadius }) => borderRadius || "8px"};
  box-shadow: ${({ boxShadow }) => boxShadow || "0 4px 8px rgba(0, 0, 0, 0.1)"};
  font-size: 12px;
  align-items: center;
  justify-content: center;
`;

export const ColorName = styled.span`
  margin-top: 8px;
  color: #555;
`;

export const ColorHex = styled.span`
  color: #777;
`;
