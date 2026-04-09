import styled from "styled-components";

interface MobilePageHeaderWrapperProps {
  isBackButton: boolean;
}

export const MobilePageHeaderWrapper = styled.div<MobilePageHeaderWrapperProps>`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  height: 56px;
  background: ${({ theme }) => theme.murv.color.surface.neutral.default};
  padding: ${({ theme }) => theme.murv.spacing.s};
  padding-left: ${({ theme, isBackButton }) =>
    isBackButton ? theme.murv.spacing.s : theme.murv.spacing.xl};
  box-shadow: ${({ theme }) => theme.murv.shadow.floating};

  /* TODO: Remove once button mobile component is available */
  button {
    padding: ${({ theme }) => theme.murv.spacing.s};
  }
`;

export const BrandInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

export const BrandLogo = styled.img`
  height: 40px;
`;

export const PageTitle = styled.div`
  font-size: ${({ theme }) => theme.murv.typography.body.s.size};
  font-weight: ${({ theme }) => theme.murv.typography.body.s.weight};
  line-height: ${({ theme }) => theme.murv.typography.body.s.lineHeight};
  letter-spacing: ${({ theme }) => theme.murv.typography.body.s.letterSpacing};
`;

export const PageSubTitle = styled.div`
  font-size: ${({ theme }) => theme.murv.typography.subtext.s.size};
  font-weight: ${({ theme }) => theme.murv.typography.subtext.s.weight};
  line-height: ${({ theme }) => theme.murv.typography.subtext.s.lineHeight};
  letter-spacing: ${({ theme }) => theme.murv.typography.subtext.s.letterSpacing};
`;

export const RightContent = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: auto;
`;
