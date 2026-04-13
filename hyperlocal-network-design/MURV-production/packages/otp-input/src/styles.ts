import styled from "styled-components";

export const ContainerStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
};

export const OTPInputContainer = styled.div`
  display: flex;
  width: 280px;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.murv.spacing.xxs};
`;

export const InputLabel = styled.div`
  color: ${({ theme }) => theme.murv.color.text.primary};
  font-size: ${({ theme }) => theme.murv.spacing.l};
  font-weight: ${({ theme }) => theme.murv.typography.subtext.s.weight};
  line-height: ${({ theme }) => theme.murv.typography.subtext.s.lineHeight};
  letter-spacing: ${({ theme }) => theme.murv.typography.heading.s.letterSpacing};
`;

export const StyledInput = styled.input<{ isDisabled?: boolean; hasErrored?: boolean }>`
  display: flex;
  width: 40px !important;
  height: 40px;
  padding: ${({ theme }) => theme.murv.spacing.xxs};
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: ${({ theme }) => theme.murv.spacing.xxs};

  border-radius: var(--radius-radius-s, 8px);
  ${(props) => {
    if (props.hasErrored) {
      return `border: 1px solid ${props.theme.murv.color.text.danger};`;
    }
    if (props.isDisabled) {
      return `border: 1px solid ${props.theme.murv.color.stroke.disabled};`;
    }
    return `border: 1px solid ${props.theme.murv.color.stroke.primary};`;
  }}
`;

export const ErrorMsg = styled.div`
  color: ${({ theme }) => theme.murv.color.text.danger};
  font-size: ${({ theme }) => theme.murv.spacing.l};
  font-weight: ${({ theme }) => theme.murv.typography.subtext.s.weight};
  line-height: ${({ theme }) => theme.murv.typography.subtext.s.lineHeight};
  letter-spacing: ${({ theme }) => theme.murv.typography.heading.s.letterSpacing};
`;

export const ResendOTP = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.murv.spacing.s};
  align-self: stretch;
`;

export const ResendText = styled.div<{ isDisabled: boolean }>`
  color: ${({ isDisabled, theme }) =>
    isDisabled ? `${theme.murv.color.text.disabled}` : `${theme.murv.color.text.secondary}`};
  min-width: 130px;
  font-size: ${({ theme }) => theme.murv.spacing.l};
  font-weight: ${({ theme }) => theme.murv.typography.subtext.s.weight};
  line-height: ${({ theme }) => theme.murv.typography.subtext.s.lineHeight};
  letter-spacing: ${({ theme }) => theme.murv.typography.heading.s.letterSpacing};
`;
