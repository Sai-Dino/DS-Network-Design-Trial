import styled from "styled-components";

export const ProductHeaderWrapper = styled.div`
  width: 100%;
  height: 56px;
  background: ${({ theme }) => theme.murv.color.surface.neutral.default};
  padding: ${({ theme }) => `${theme.murv.spacing[0]} ${theme.murv.spacing.xxl}`};
  border-bottom: ${({ theme }) => `1px solid ${theme.murv.color.stroke.primary}`};
`;

export const ProductHeaderContent = styled.div<{ contentWidth: string }>`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: ${({ theme }) => theme.murv.spacing.xxl};
  height: 100%;
  width: ${({ contentWidth }) => contentWidth};
  margin: 0 auto;
`;

export const BrandLogo = styled.img`
  height: 40px;
`;

export const RightContent = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: auto;
`;
