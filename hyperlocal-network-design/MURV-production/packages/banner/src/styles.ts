import styled, { keyframes } from "styled-components";

const breakpoint = {
  mobile: "480px",
};

const zoomOutAnimation = keyframes`
  from {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(0);
    opacity: 0;
  }
`;

export const BannerContainer = styled.div<{ visible: boolean; exiting: boolean }>`
  display: flex;
  padding: ${({ theme }) => theme.murv.spacing.l};
  align-items: flex-start;
  align-content: flex-start;
  gap: ${({ theme }) => theme.murv.spacing.l};
  flex: 1 0 0;
  flex-wrap: wrap;
  border-radius: ${({ theme }) => theme.murv.radius.m};
  animation: ${({ exiting }) => (exiting ? zoomOutAnimation : "none")} 0.3s ease-out;
  min-width: 332px;
  &.success {
    border: 2px solid ${({ theme }) => theme.murv.color.stroke.success};
    background: ${({ theme }) => theme.murv.color.surface.success.default};
  }

  &.error {
    border: 2px solid ${({ theme }) => theme.murv.color.stroke.dangerlight};
    background: ${({ theme }) => theme.murv.color.surface.danger.default};
  }

  &.warning {
    border: 2px solid ${({ theme }) => theme.murv.color.stroke.warning};
    background: ${({ theme }) => theme.murv.color.surface.warning.default};
  }

  &.information {
    border: 2px solid ${({ theme }) => theme.murv.color.stroke.selected};
    background: ${({ theme }) => theme.murv.color.surface.information.default};
  }

  @media (max-width: ${breakpoint.mobile}) {
    min-width: 296px;
  }
`;

export const ContentWrapper = styled.div`
  display: flex;
  align-items: center;
  align-content: flex-start;
  gap: ${({ theme }) => theme.murv.spacing.l};
  flex: 1 0 0;
  flex-wrap: wrap;
`;

export const PrimaryText = styled.div`
  color: ${({ theme }) => theme.murv.color.text.primary};
  font-size: ${({ theme }) => theme.murv.typography.body.sBold.size};
  font-weight: ${({ theme }) => theme.murv.typography.body.sBold.weight};
  line-height: ${({ theme }) => theme.murv.typography.body.sBold.lineHeight};
`;

export const SecondaryText = styled.div`
  min-width: 240px;
  max-height: 40px;
  flex: 1 0 0;
  color: ${({ theme }) => theme.murv.color.text.secondary};
  font-size: ${({ theme }) => theme.murv.typography.body.s.size};
  font-weight: ${({ theme }) => theme.murv.typography.subtext.s.weight};
  line-height: ${({ theme }) => theme.murv.typography.body.s.lineHeight};
`;

export const TertiaryText = styled.div`
  display: block;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  color: ${({ theme }) => theme.murv.color.text.secondary};
  font-size: ${({ theme }) => theme.murv.typography.subtext.s.size};
  font-weight: ${({ theme }) => theme.murv.typography.subtext.s.weight};
  line-height: ${({ theme }) => theme.murv.typography.subtext.s.lineHeight};
  letter-spacing: ${({ theme }) => theme.murv.typography.heading.s.letterSpacing};
`;

export const IconWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  cursor: pointer;
`;
