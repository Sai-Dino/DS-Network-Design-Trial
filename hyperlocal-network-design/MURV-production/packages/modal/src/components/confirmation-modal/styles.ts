import styled from "styled-components";
import { Modal } from "../common/Modal";
import { breakpoint } from "../common/styles";
import { IModal } from "../../types";

export const StyledModal: React.FC<IModal> = styled(Modal)`
  @media (max-width: ${breakpoint.mobile}) {
    max-width: 320px;
  }
  @media (min-width: ${breakpoint.mobile}) {
    min-width: 400px;
    max-width: 720px;
    max-height: 580px;
  }
`;

export const HeaderWrapper = styled.div`
  display: flex;
  padding: ${({ theme }) => theme.murv.spacing.s};
  justify-content: space-between;
  align-items: center;

  & > h3 {
    font-size: ${({ theme }) => theme.murv.typography.heading.s.size};
    line-height: ${({ theme }) => theme.murv.typography.heading.s.lineHeight};
    font-weight: ${({ theme }) => theme.murv.typography.heading.s.weight};
    letter-spacing: ${({ theme }) => theme.murv.typography.heading.s.letterSpacing};
  }
`;

export const ContentWrapper = styled.div`
  padding: ${({ theme }) => theme.murv.spacing.l};
  display: flex;
  gap: ${({ theme }) => theme.murv.spacing.xl};
  justify-content: flex-start;
  align-items: flex-start;
  flex-grow: 1;
`;

export const ContentTextWrapper = styled.p`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.murv.spacing.xxs};
  align-items: flex-start;

  font-size: ${({ theme }) => theme.murv.typography.body.s.size};
  line-height: ${({ theme }) => theme.murv.typography.body.s.lineHeight};
  font-weight: ${({ theme }) => theme.murv.typography.subtext.s.weight};
  letter-spacing: ${({ theme }) => theme.murv.typography.body.s.letterSpacing};

  & > strong {
    font-size: ${({ theme }) => theme.murv.typography.body.sBold.size};
    line-height: ${({ theme }) => theme.murv.typography.body.sBold.lineHeight};
    font-weight: ${({ theme }) => theme.murv.typography.body.sBold.weight};
    letter-spacing: ${({ theme }) => theme.murv.typography.body.sBold.letterSpacing};
  }

  & > span {
    font-size: ${({ theme }) => theme.murv.typography.subtext.s.size};
    line-height: ${({ theme }) => theme.murv.typography.subtext.s.lineHeight};
    font-weight: ${({ theme }) => theme.murv.typography.subtext.s.weight};
    letter-spacing: ${({ theme }) => theme.murv.typography.subtext.s.letterSpacing};
  }
`;

export const ContentIconWrapper = styled.div`
  display: flex;
  min-width: 32px;
  max-width: 32px;
  @media (max-width: ${breakpoint.mobile}) {
    min-width: 28px;
    max-width: 28px;
  }
`;

export const LoaderContainer = styled(ContentIconWrapper)`
  align-items:  center;
  height: 100%;
  min-height: 32px;
  @media (max-width: ${breakpoint.mobile}) {
    min-height: 28px;
  }
`