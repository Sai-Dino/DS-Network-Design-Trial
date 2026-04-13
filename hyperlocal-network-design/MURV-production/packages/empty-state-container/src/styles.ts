import styled from "styled-components";

export const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background-color: ${({ theme }) => theme.murv.color.surface.neutral.default};
  height: 100%;
  width: 100%;
`;
export const PrimaryText = styled.span`
  user-select: none;
  line-height: ${({ theme }) => theme.murv.typography.body.s.lineHeight};
  color: ${({ theme }) => theme.murv.color.text.primary};
  font-weight: ${({ theme }) => theme.murv.typography.body.sBold.weight};
  font-size: ${({ theme }) => theme.murv.typography.body.s.size};
`;
export const UserText = styled.span`
  user-select: none;
  line-height: ${({ theme }) => theme.murv.typography.subtext.s.lineHeight};
  color: ${({ theme }) => theme.murv.color.text.primary};
  font-weight: ${({ theme }) => theme.murv.typography.subtext.s.weight};
  font-size: ${({ theme }) => theme.murv.typography.subtext.s.size};
`;
export const ButtonWrapper = styled.div`
  display: flex;
  padding: ${({ theme }) => theme.murv.spacing.l};
  align-items: center;
  align-content: center;
  flex-wrap: wrap;
`;

export const Illustration = styled.img``;
