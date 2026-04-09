import styled from "styled-components";

export const PopoverWrapper = styled.div`
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  border-radius: ${({ theme }) => theme.murv.radius.xxl};
  background-color: ${({ theme }) => theme.murv.color.surface.neutral.default};
  box-shadow: ${({ theme }) =>
    `0px ${theme.murv.spacing.xxs} ${theme.murv.spacing.xs} ${theme.murv.spacing.xs} rgba(0, 0, 0, 0.08)`};
`;

export const PopoverHeaderWrapper = styled.div`
  display: flex;
  padding: ${({ theme }) => `${theme.murv.spacing.xxs} ${theme.murv.spacing.xl}`};
  gap: ${({ theme }) => theme.murv.spacing.l};
  border-bottom: 1px solid ${({ theme }) => theme.murv.color.stroke.primary};
`;

export const IconWrapper = styled.div`
  display: flex;
  padding: ${({ theme }) => theme.murv.spacing.s};
  gap: ${({ theme }) => theme.murv.spacing.s};
  cursor: pointer;
`;

export const HeaderLabel = styled.div`
  display: flex;
  align-items: center;
  flex: 1 0 0;
  color: ${({ theme }) => theme.murv.color.text.primary};
  font-size: ${({ theme }) => theme.murv.typography.subtext.s.size};
  font-weight: ${({ theme }) => theme.murv.typography.subtext.s.weight};
  line-height: ${({ theme }) => theme.murv.typography.subtext.s.lineHeight};
`;
