import styled from "styled-components";

export const PageHeaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  flex-direction: column;
  gap: ${({ theme }) => theme.murv.spacing.s};
  width: 100%;
  padding: ${({ theme }) => `${theme.murv.spacing.m} ${theme.murv.spacing.xxxl}`};
  background-color: ${({ theme }) => theme.murv.color.surface.neutral.default};
  /* TODO: remove this once icons are implemented */
  .temp {
    span {
      display: flex;
    }
  }
`;

export const PageHeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

export const LeftContent = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${({ theme }) => theme.murv.spacing.l};
`;

export const RightContent = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${({ theme }) => theme.murv.spacing.l};
`;

export const TagsWrapper = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.murv.spacing.xxs};
`;

export const HeaderText = styled.h1`
  font-size: ${({ theme }) => theme.murv.typography.heading.l.size};
  font-weight: ${({ theme }) => theme.murv.typography.heading.l.weight};
  line-height: ${({ theme }) => theme.murv.typography.heading.l.lineHeight};
  letter-spacing: ${({ theme }) => theme.murv.typography.heading.l.letterSpacing};
  margin-block-start: ${({ theme }) => theme.murv.spacing.xs};
  margin-block-end: ${({ theme }) => theme.murv.spacing.s};
`;
