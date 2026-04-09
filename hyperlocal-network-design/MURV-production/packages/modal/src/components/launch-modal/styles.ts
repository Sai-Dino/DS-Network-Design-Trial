import styled from "styled-components";
import { Modal } from "../common/Modal";
import { breakpoint } from "../common/styles";
import { ILaunchModalTextListContent, IModal } from "../../types";
import { TEXTLIST_CONTENT_ICON_POSITIONS } from "../../constants";

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

export const HeaderWrapper = styled.header`
  padding: ${({ theme }) => theme.murv.spacing.s};
  text-align: center;
  outline: none;

  & > h3 {
    font-size: ${({ theme }) => theme.murv.typography.heading.s.size};
    line-height: ${({ theme }) => theme.murv.typography.heading.s.lineHeight};
    font-weight: ${({ theme }) => theme.murv.typography.heading.s.weight};
    letter-spacing: ${({ theme }) => theme.murv.typography.heading.s.letterSpacing};
  }

  & > p {
    font-size: ${({ theme }) => theme.murv.typography.body.s.size};
    line-height: ${({ theme }) => theme.murv.typography.body.s.lineHeight};
    font-weight: ${({ theme }) => theme.murv.typography.subtext.s.weight};
    letter-spacing: ${({ theme }) => theme.murv.typography.body.s.letterSpacing};
  }
`;

export const ContentWrapper = styled.div`
  flex-grow: 1;
`;

export const TextListContentWrapper = styled.ul`
  padding: ${({ theme }) => `${theme.murv.spacing.l} 0`};
  list-style: none;
`;

export const TextListContentItem = styled.li<Pick<ILaunchModalTextListContent, "iconPosition">>`
  padding: ${({ theme }) => theme.murv.spacing.l};
  display: flex;
  gap: ${({ theme }) => theme.murv.spacing.xl};
  align-items: flex-start;
  justify-content: ${({ iconPosition }) =>
    iconPosition === TEXTLIST_CONTENT_ICON_POSITIONS.RIGHT ? "space-between" : "flex-start"};
  flex-direction: ${({ iconPosition }) =>
    iconPosition === TEXTLIST_CONTENT_ICON_POSITIONS.RIGHT ? "row-reverse" : "row"};

  & > p {
    display: inline-flex;
    flex-direction: column;
    justify-content: space-between;
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
  }
`;

export const MultimediaContentResourceWrapper = styled.div`
  padding: ${({ theme }) => theme.murv.spacing.l};
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex-shrink: 1;

  & > img,
  & > video {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
`;

export const MultimediaContentTextWrapper = styled.p`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.murv.spacing.xxs};
  padding: ${({ theme }) => theme.murv.spacing.l};
  text-align: center;

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
