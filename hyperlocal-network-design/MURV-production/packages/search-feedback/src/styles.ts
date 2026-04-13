import styled from "styled-components";

const breakpoint = {
  mobile: "768px",
  maxWidth: "630px",
};

export const SearchIconWrapper = styled.div``;

export const DividerAndIconsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
  @media (max-width: ${breakpoint.mobile}) {
    gap: ${({ theme }) => theme.murv.spacing.xxxs};
    flex-direction: column;
    width: max-content;
  }
`; // Placeholder to hold icons and divider together.

export const FlexBox = styled.div`
  display: flex;
  width: fit-content;
`;

export const MixedMessageWrapper = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.murv.spacing.s};
  @media (max-width: ${breakpoint.mobile}) {
    gap: ${({ theme }) => theme.murv.spacing.xxxs};
    flex-direction: column;
    width: max-content;
  }
`;

export const ButtonContainer = styled.div``;

export const FeedbackBaseText = styled.p`
  font-weight: ${({ theme }) => theme.murv.typography.subtext.s.weight};
  color: ${({ theme }) => theme.murv.color.text.primary};
  font-size: ${({ theme }) => theme.murv.typography.body.s.size};
  line-height: ${({ theme }) => theme.murv.typography.body.s.lineHeight};
`;

export const FailedItemsText = styled(FeedbackBaseText)`
  color: ${({ theme }) => theme.murv.color.text.danger};
`;

export const FeedbackContainer = styled(FlexBox)<{ width: string; showActions?: boolean }>`
  align-items: center;
  padding: ${({ theme }) => theme.murv.spacing.s};
  ${({ theme }) => theme.murv.spacing.xl};
  gap: ${({ theme }) => theme.murv.spacing.s};
  border-radius: ${({ theme }) => theme.murv.radius.s};
  background: ${({ theme }) => theme.murv.color.surface.information.default};
  @media (max-width: ${breakpoint.mobile}) {
    padding: ${({ theme }) => theme.murv.spacing.l};
    border-radius: 0;
    border: 1px solid ${({ theme }) => theme.murv.color.stroke.primary};
    align-items: flex-start;
  }
  width: ${({ width }) => width || "fit-content"};
  max-width: ${({ width }) => (width ? breakpoint.maxWidth : "fit-content")};
  justify-content: ${({ width, showActions }) =>
    showActions && width ? "space-between" : "flex-start"};
`;

export const SeperatorStyles = {
  height: "20px",
  width: "1px",
  alignSelf: "center",
};

export const SeperatorContainer = styled.div`
  ${SeperatorStyles}
  @media (max-width: ${breakpoint.mobile}) {
    display: none;
  }
`;

export const LabelText = styled.span`
  color: ${({ theme }) => theme.murv.color.surface.brand.default};
`;
